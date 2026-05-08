'use client'

import React, { createContext, useContext, useEffect, useReducer, useCallback, useRef } from 'react'
import { createTransaction, updateTransaction, deleteTransaction } from '@/app/actions/transactions'

// ─── TYPES ───────────────────────────────────────────────────────────────────
export type Transaction = any
export type OperationStatus = 'pending' | 'processing' | 'failed' | 'success' | 'conflict'

export type Operation = {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  txId: string
  payload?: any
  status: OperationStatus
  retryCount: number
  createdAt: number
  workspaceId: string
  error?: string
}

export type ConflictPayload = {
  operation: Operation
  serverRecord: Transaction
}

type State = {
  serverData: Transaction[]
  operationsQueue: Operation[]
  conflictPayload: ConflictPayload | null
}

type Action =
  | { type: 'INIT_SERVER_DATA'; payload: Transaction[] }
  | { type: 'QUEUE_OPERATION'; payload: Operation }
  | { type: 'UPDATE_OPERATION_STATUS'; id: string; status: OperationStatus; error?: string; retryCount?: number }
  | { type: 'OPERATION_SUCCESS'; id: string; serverTx?: Transaction; deletedId?: string; tempIdMap?: { temp: string; real: string } }
  | { type: 'CANCEL_OPERATION'; id: string }
  | { type: 'SYNC_FROM_BROADCAST'; payload: Operation[] }
  | { type: 'SET_CONFLICT'; payload: ConflictPayload | null }
  | { type: 'REALTIME_UPSERT'; payload: Transaction }
  | { type: 'REALTIME_DELETE'; txId: string }

// ─── UTILS ───────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const BACKOFF_DELAYS = [1000, 2000, 5000]

// ─── OPTIMISTIC ENGINE ───────────────────────────────────────────────────────
export function applyOperations(serverData: Transaction[], operationsQueue: Operation[]): Transaction[] {
  let result = [...serverData]
  const sortedOps = [...operationsQueue].sort((a, b) => a.createdAt - b.createdAt)

  for (const op of sortedOps) {
    if (op.status === 'failed' || op.status === 'conflict') continue

    if (op.type === 'DELETE') {
      result = result.map(t => t.id === op.txId ? { ...t, _pendingDelete: true } : t)
    } else if (op.type === 'UPDATE') {
      result = result.map(t => t.id === op.txId ? { ...t, ...op.payload } : t)
    } else if (op.type === 'CREATE') {
      result = [{ id: op.txId, ...op.payload, _isOptimistic: true }, ...result]
    }
  }

  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// ─── REDUCER ─────────────────────────────────────────────────────────────────
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT_SERVER_DATA':
      return { ...state, serverData: action.payload }

    case 'QUEUE_OPERATION': {
      if (state.operationsQueue.some(op => op.id === action.payload.id)) return state
      return { ...state, operationsQueue: [...state.operationsQueue, action.payload] }
    }

    case 'UPDATE_OPERATION_STATUS':
      return {
        ...state,
        operationsQueue: state.operationsQueue.map(op =>
          op.id === action.id
            ? { ...op, status: action.status, error: action.error, retryCount: action.retryCount ?? op.retryCount }
            : op
        )
      }

    case 'OPERATION_SUCCESS': {
      const nextOps = state.operationsQueue.filter(op => op.id !== action.id)
      let nextServerData = [...state.serverData]

      if (action.deletedId) {
        nextServerData = nextServerData.filter(t => t.id !== action.deletedId)
      } else if (action.serverTx) {
        const exists = nextServerData.find(t => t.id === action.serverTx!.id || t.id === action.tempIdMap?.temp)
        if (exists) {
          nextServerData = nextServerData.map(t =>
            (t.id === action.serverTx!.id || t.id === action.tempIdMap?.temp) ? action.serverTx! : t
          )
        } else {
          nextServerData = [action.serverTx, ...nextServerData]
        }
      }

      if (action.tempIdMap) {
        nextOps.forEach(op => {
          if (op.txId === action.tempIdMap!.temp) {
            op.txId = action.tempIdMap!.real
            if (op.payload) op.payload.id = action.tempIdMap!.real
          }
        })
      }

      return { ...state, serverData: nextServerData, operationsQueue: nextOps }
    }

    case 'CANCEL_OPERATION':
      return { ...state, operationsQueue: state.operationsQueue.filter(op => op.id !== action.id) }

    case 'SYNC_FROM_BROADCAST':
      return { ...state, operationsQueue: action.payload }

    case 'SET_CONFLICT':
      return { ...state, conflictPayload: action.payload }

    case 'REALTIME_UPSERT': {
      const exists = state.serverData.find(t => t.id === action.payload.id)
      const nextServerData = exists
        ? state.serverData.map(t => t.id === action.payload.id ? action.payload : t)
        : [action.payload, ...state.serverData]
      return { ...state, serverData: nextServerData }
    }

    case 'REALTIME_DELETE':
      return { ...state, serverData: state.serverData.filter(t => t.id !== action.txId) }

    default:
      return state
  }
}

// ─── CONTEXT ─────────────────────────────────────────────────────────────────
const TransactionsContext = createContext<{
  transactions: Transaction[]
  pendingOperations: Operation[]
  conflictPayload: ConflictPayload | null
  dispatchOperation: (op: { type: 'CREATE' | 'UPDATE' | 'DELETE'; txId?: string; payload?: any; workspaceId: string }) => void
  retryOperation: (opId: string) => void
  cancelOperation: (opId: string) => void
  resolveConflict: (resolution: 'keep-mine' | 'accept-server' | 'manual' | 'cancel', manualPayload?: any) => void
  realtimeUpsert: (tx: Transaction) => void
  realtimeDelete: (txId: string) => void
} | null>(null)

// ─── PROVIDER ────────────────────────────────────────────────────────────────
export function TransactionsProvider({
  initialData,
  workspaceId,
  children
}: {
  initialData: Transaction[]
  workspaceId: string
  children: React.ReactNode
}) {
  const [state, dispatch] = useReducer(reducer, {
    serverData: initialData,
    operationsQueue: [],
    conflictPayload: null
  })
  const channelRef = useRef<BroadcastChannel | null>(null)
  const processingRef = useRef(false)

  // ── Multi-Tab Sync ──
  useEffect(() => {
    channelRef.current = new BroadcastChannel('transactions')
    channelRef.current.onmessage = (event) => {
      if (event.data.type === 'SYNC_OPS') {
        dispatch({ type: 'SYNC_FROM_BROADCAST', payload: event.data.operationsQueue })
      } else if (event.data.type === 'EXTERNAL_DISPATCH') {
        dispatch({ type: 'QUEUE_OPERATION', payload: event.data.payload })
      }
    }
    return () => channelRef.current?.close()
  }, [workspaceId])

  useEffect(() => {
    channelRef.current?.postMessage({ type: 'SYNC_OPS', operationsQueue: state.operationsQueue })
  }, [state.operationsQueue])

  // ── Queue Processor ──
  useEffect(() => {
    const processQueue = async () => {
      if (processingRef.current) return
      const nextOp = state.operationsQueue.find(op => op.status === 'pending')
      if (!nextOp) return

      processingRef.current = true
      dispatch({ type: 'UPDATE_OPERATION_STATUS', id: nextOp.id, status: 'processing' })

      try {
        let res: any

        if (nextOp.type === 'CREATE') {
          res = await createTransaction({ ...nextOp.payload, workspace_id: nextOp.workspaceId })
        } else if (nextOp.type === 'UPDATE') {
          res = await updateTransaction({ ...nextOp.payload, workspace_id: nextOp.workspaceId })
        } else if (nextOp.type === 'DELETE') {
          res = await deleteTransaction(nextOp.txId, nextOp.workspaceId)
        }

        // Conflict: open resolution modal, do NOT auto-retry
        if (res?.status === 409 || res?.error === 'CONFLICT') {
          dispatch({ type: 'SET_CONFLICT', payload: { operation: nextOp, serverRecord: res.serverRecord } })
          dispatch({ type: 'UPDATE_OPERATION_STATUS', id: nextOp.id, status: 'conflict', error: 'CONFLICT' })
          return
        }

        if (res?.error) throw { message: res.error, isNetwork: false }

        dispatch({
          type: 'OPERATION_SUCCESS',
          id: nextOp.id,
          serverTx: (nextOp.type === 'CREATE' || nextOp.type === 'UPDATE') ? res.data : undefined,
          deletedId: nextOp.type === 'DELETE' ? nextOp.txId : undefined,
          tempIdMap: nextOp.type === 'CREATE' ? { temp: nextOp.txId, real: res.data.id } : undefined
        })

      } catch (err: any) {
        console.error('[Queue Processor] Error:', err)
        if (err.isNetwork !== false && nextOp.retryCount < 3) {
          const delay = BACKOFF_DELAYS[nextOp.retryCount] ?? 5000
          await sleep(delay)
          dispatch({ type: 'UPDATE_OPERATION_STATUS', id: nextOp.id, status: 'pending', retryCount: nextOp.retryCount + 1 })
        } else {
          dispatch({ type: 'UPDATE_OPERATION_STATUS', id: nextOp.id, status: 'failed', error: err.message ?? 'Unknown error' })
        }
      } finally {
        processingRef.current = false
      }
    }

    processQueue()
  }, [state.operationsQueue])

  // ── Actions ──
  const dispatchOperation = useCallback(({ type, txId, payload, workspaceId }: {
    type: 'CREATE' | 'UPDATE' | 'DELETE'; txId?: string; payload?: any; workspaceId: string
  }) => {
    const resolvedId = type === 'CREATE' ? `temp-${crypto.randomUUID()}` : txId!
    const op: Operation = {
      id: crypto.randomUUID(),
      type,
      txId: resolvedId,
      payload,
      status: 'pending',
      workspaceId,
      retryCount: 0,
      createdAt: Date.now()
    }
    dispatch({ type: 'QUEUE_OPERATION', payload: op })
  }, [])

  const retryOperation = useCallback((opId: string) => {
    dispatch({ type: 'UPDATE_OPERATION_STATUS', id: opId, status: 'pending', retryCount: 0 })
  }, [])

  const cancelOperation = useCallback((opId: string) => {
    dispatch({ type: 'CANCEL_OPERATION', id: opId })
  }, [])

  const resolveConflict = useCallback((
    resolution: 'keep-mine' | 'accept-server' | 'manual' | 'cancel',
    manualPayload?: any
  ) => {
    const conflict = state.conflictPayload
    if (!conflict) return

    dispatch({ type: 'SET_CONFLICT', payload: null })

    if (resolution === 'keep-mine') {
      // Re-queue with updated version_no from server (force overwrite)
      const newOp: Operation = {
        ...conflict.operation,
        id: crypto.randomUUID(),
        payload: { ...conflict.operation.payload, expected_version: conflict.serverRecord.version_no },
        status: 'pending',
        retryCount: 0,
        createdAt: Date.now()
      }
      dispatch({ type: 'CANCEL_OPERATION', id: conflict.operation.id })
      dispatch({ type: 'QUEUE_OPERATION', payload: newOp })

    } else if (resolution === 'accept-server') {
      dispatch({ type: 'CANCEL_OPERATION', id: conflict.operation.id })
      dispatch({ type: 'REALTIME_UPSERT', payload: conflict.serverRecord })

    } else if (resolution === 'manual') {
      const newOp: Operation = {
        ...conflict.operation,
        id: crypto.randomUUID(),
        payload: { ...manualPayload, expected_version: conflict.serverRecord.version_no },
        status: 'pending',
        retryCount: 0,
        createdAt: Date.now()
      }
      dispatch({ type: 'CANCEL_OPERATION', id: conflict.operation.id })
      dispatch({ type: 'QUEUE_OPERATION', payload: newOp })

    } else {
      // cancel
      dispatch({ type: 'UPDATE_OPERATION_STATUS', id: conflict.operation.id, status: 'failed', error: 'Conflict resolution cancelled' })
    }
  }, [state.conflictPayload])

  const realtimeUpsert = useCallback((tx: Transaction) => {
    dispatch({ type: 'REALTIME_UPSERT', payload: tx })
  }, [])

  const realtimeDelete = useCallback((txId: string) => {
    dispatch({ type: 'REALTIME_DELETE', txId })
  }, [])

  const optimisticTransactions = React.useMemo(() =>
    applyOperations(state.serverData, state.operationsQueue),
  [state.serverData, state.operationsQueue])

  return (
    <TransactionsContext.Provider value={{
      transactions: optimisticTransactions,
      pendingOperations: state.operationsQueue,
      conflictPayload: state.conflictPayload,
      dispatchOperation,
      retryOperation,
      cancelOperation,
      resolveConflict,
      realtimeUpsert,
      realtimeDelete,
    }}>
      {children}
    </TransactionsContext.Provider>
  )
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext)
  if (!ctx) throw new Error('useTransactions must be used within TransactionsProvider')
  return ctx
}

export function dispatchExternalOperation(workspaceId: string, type: 'CREATE' | 'UPDATE' | 'DELETE', txId?: string, payload?: any) {
  const id = type === 'CREATE' ? `temp-${crypto.randomUUID()}` : txId!
  const op: Operation = {
    id: crypto.randomUUID(),
    type,
    txId: id,
    payload,
    status: 'pending',
    workspaceId,
    retryCount: 0,
    createdAt: Date.now()
  }
  const channel = new BroadcastChannel('transactions')
  channel.postMessage({ type: 'EXTERNAL_DISPATCH', payload: op })
  channel.close()
}
