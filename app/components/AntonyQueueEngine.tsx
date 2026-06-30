'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface QueueTask {
  id: string;
  payloadHash: string;
  targetNode: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMMITTED' | 'DROPPED';
  priority: number;
}

const STATUS_COLORS: Record<QueueTask['status'], string> = {
  QUEUED: 'bg-amber-950/40 text-amber-400 border-amber-800 hover:bg-amber-900/40',
  PROCESSING: 'bg-cyan-950/40 text-cyan-400 border-cyan-800 hover:bg-cyan-900/40 animate-pulse',
  COMMITTED: 'bg-emerald-950/20 text-emerald-500 border-emerald-900/40 opacity-60 cursor-not-allowed',
  DROPPED: 'bg-red-950/20 text-red-500 border-red-900/40 opacity-60 cursor-not-allowed',
};

const NEXT_STATUS: Record<QueueTask['status'], QueueTask['status'] | null> = {
  QUEUED: 'PROCESSING',
  PROCESSING: 'COMMITTED',
  COMMITTED: null,
  DROPPED: null,
};

export default function AntonyQueueEngine() {
  const [tasks, setTasks] = useState<QueueTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setError('Firestore unavailable — set NEXT_PUBLIC_FIREBASE_* env vars');
      setLoading(false);
      return;
    }

    const queueRef = collection(db, 'vvu_antony_queue');
    const q = query(queueRef, orderBy('priority', 'desc'), limit(10));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveTasks: QueueTask[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          liveTasks.push({
            id: docSnap.id,
            payloadHash: data.payloadHash || '0x' + Math.random().toString(16).slice(2, 10),
            targetNode: data.targetNode || 'unassigned',
            status: data.status || 'QUEUED',
            priority: data.priority ?? 0,
          });
        });
        setTasks(liveTasks);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Queue telemetry connection broke:', err);
        setError('Firestore connection lost — ' + err.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const advanceTaskState = useCallback(
    async (taskId: string, currentStatus: QueueTask['status']) => {
      const next = NEXT_STATUS[currentStatus];
      if (!next || !db) return;
      try {
        const taskDoc = doc(db, 'vvu_antony_queue', taskId);
        await updateDoc(taskDoc, { status: next });
      } catch (err) {
        console.error('Failed adjusting queue event state vector:', err);
      }
    },
    [],
  );

  return (
    <div className="border border-slate-900 bg-slate-950 p-4 rounded font-mono text-xs space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-2">
        <span className="text-amber-500 font-bold tracking-widest flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          🐜 ANTONY QUEUE ENGINE
        </span>
        <span className="text-[10px] text-slate-500">REALTIME_INGEST</span>
      </div>

      {/* Error banner */}
      {error && (
        <div className="text-red-400 bg-red-950/20 border border-red-900/40 p-2 rounded text-[10px]">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="text-slate-600 animate-pulse">
          [CONNECTING_TO_QUEUE_STREAM...]
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-slate-600 italic">
          [QUEUE_EMPTY: AWAITING_PAYLOAD_ASSERTIONS]
        </div>
      ) : (
        /* Task list */
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-slate-900/40 border border-slate-900 p-2.5 rounded flex items-center justify-between hover:border-slate-800 transition-colors"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-[11px] truncate max-w-[120px]">
                    {task.payloadHash}
                  </span>
                  <span className="text-[9px] px-1.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-sm">
                    PRIO_{task.priority}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Target Segment: {task.targetNode}
                </p>
              </div>

              <button
                onClick={() => advanceTaskState(task.id, task.status)}
                disabled={task.status === 'COMMITTED' || task.status === 'DROPPED'}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                  STATUS_COLORS[task.status] || ''
                }`}
              >
                {task.status}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
