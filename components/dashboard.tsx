'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  Plus,
  Calendar,
  Tag,
  Folder,
  Star,
  Bookmark,
  Check,
  Heart,
  Bell,
  Camera,
  Clock,
  Flag,
  Gift,
  Globe,
  Book,
  Briefcase,
  User,
  Users,
  Wallet,
  Plane,
  Utensils,
} from 'lucide-react';
import {
  Fade,
  Zoom,
  TextField,
  Select as MuiSelect,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { MuiThemeProvider } from './mui-theme-provider';
import { PRESET_CATEGORIES } from '@/lib/presets';
import { getJSON, setJSON } from '@/lib/cache';

// Types
// Categories are client-side presets; Note stores category name string
export type Category = {
  name: string;
  color: string;
  icon?: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  category?: string | null; // category name
  updatedAt?: string;
  createdAt?: string;
};

// Constants
const ICONS = {
  Tag,
  Folder,
  Star,
  Bookmark,
  Check,
  Heart,
  Bell,
  Calendar,
  Camera,
  Clock,
  Flag,
  Gift,
  Globe,
  Book,
  Briefcase,
  User,
  Users,
  Wallet,
  Plane,
  Utensils,
} as const;

type IconKey = keyof typeof ICONS;

// Utility functions
const hexToRgba = (hex: string, alpha = 0.15) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatDateTime = (iso?: string) => {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const dd = pad(d.getDate());
  const MM = pad(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  return `${HH}:${mm} ${dd}:${MM}:${yyyy}`;
};

// PRESET_CATEGORIES now imported from shared module

export function Dashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewNote, setViewNote] = useState<Note | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [draftNote, setDraftNote] = useState<{
    title: string;
    content: string;
    category: string;
  }>({
    title: '',
    content: '',
    category: '',
  });
  // Category deletion disabled – no state needed

  // Map current draftNote.category (name) to its preset key for the selects
  const selectedPresetKey = useMemo(() => {
    if (!draftNote.category) return '';
    const match = PRESET_CATEGORIES.find((p) => p.name === draftNote.category);
    return match ? match.key : '';
  }, [draftNote.category]);

  // Load cached data immediately for perceived performance
  useEffect(() => {
    const cachedNotes = getJSON<Note[]>('notes');
    if (cachedNotes) setNotes(cachedNotes);
  }, []);

  const fetchAll = async () => {
    try {
      const [notesRes] = await Promise.all([
        fetch(`/api/notes?q=${encodeURIComponent(q)}`),
      ]);
      if (!notesRes.ok) {
        // Only show error toast for actual server errors, not for empty results
        if (notesRes.status >= 500) {
          throw new Error('Failed to load notes');
        } else if (notesRes.status === 401) {
          throw new Error('Unauthorized');
        } else {
          // For other errors like 404, just set empty array
          setNotes([]);
          setJSON('notes', []);
          return;
        }
      }
      const notesData = await notesRes.json();
      setNotes(notesData);
      // write-through cache
      setJSON('notes', notesData);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Load failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search: fetch notes 2s after typing stops
  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      fetchAll();
    }, 2000);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const filteredNotes = useMemo(() => notes, [notes]);

  // Helper: find or create a category by preset key/name, then select it
  const selectCategoryByIdOrPreset = async (value: string) => {
    // Empty selection
    if (!value) {
      setDraftNote((d) => ({ ...d, category: '' }));
      return;
    }
    // Otherwise treat value as preset key; find preset details
    const presetMeta = PRESET_CATEGORIES.find((p) => p.key === value);
    if (!presetMeta) {
      // Fallback: set as none
      setDraftNote((d) => ({ ...d, category: '' }));
      return;
    }
    // Just set category name directly
    setDraftNote((d) => ({ ...d, category: presetMeta.name }));
  };

  // Note: Category creation has been removed; modal is edit-only now.

  const submitNote = async () => {
    if (!draftNote.title) return toast.error('Title is required');
    // optimistic add
    const tempId = `temp-${Date.now()}`;
    const optimistic: Note = {
      id: tempId,
      title: draftNote.title,
      content: draftNote.content,
      category: draftNote.category || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => {
      const next = [optimistic, ...prev];
      setJSON('notes', next);
      return next;
    });
    setShowNoteModal(false);
    setDraftNote({ title: '', content: '', category: '' });

    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: draftNote.title,
        content: draftNote.content,
        category: draftNote.category || null,
      }),
    });
    if (!res.ok) {
      // rollback
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== tempId);
        setJSON('notes', next);
        return next;
      });
      return toast.error('Create note failed');
    }
    const created = (await res.json()) as Note;
    // reconcile temp -> real
    setNotes((prev) => {
      const next = prev.map((n) =>
        n.id === tempId ? { ...created, category: optimistic.category } : n
      );
      setJSON('notes', next);
      return next;
    });
    toast.success('Note created');
  };

  const updateNote = async (note: Note) => {
    setEditingNote(note);
    setDraftNote({
      title: note.title,
      content: note.content,
      category: note.category || '',
    });
    setShowEditModal(true);
  };

  const submitEditNote = async () => {
    if (!editingNote || !draftNote.title)
      return toast.error('Title is required');
    // optimistic update
    const prevSnapshot = notes.slice();
    const nextCategory = draftNote.category || null;
    setNotes((prev) => {
      const next = prev.map((n) =>
        n.id === editingNote.id
          ? {
              ...n,
              title: draftNote.title,
              content: draftNote.content,
              category: nextCategory,
              updatedAt: new Date().toISOString(),
            }
          : n
      );
      setJSON('notes', next);
      return next;
    });
    const res = await fetch(`/api/notes/${editingNote.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: draftNote.title,
        content: draftNote.content,
        category: draftNote.category || null,
      }),
    });
    if (!res.ok) {
      // rollback
      setNotes(prevSnapshot);
      setJSON('notes', prevSnapshot);
      return toast.error('Update failed');
    }
    toast.success('Note updated');
    setShowEditModal(false);
    setEditingNote(null);
    setDraftNote({ title: '', content: '', category: '' });
  };

  const removeNote = async (note: Note) => {
    setNoteToDelete(note);
    setShowDeleteModal(true);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    // optimistic remove
    const prevSnapshot = notes.slice();
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== noteToDelete.id);
      setJSON('notes', next);
      return next;
    });
    const res = await fetch(`/api/notes/${noteToDelete.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      // rollback
      setNotes(prevSnapshot);
      setJSON('notes', prevSnapshot);
      return toast.error('Delete failed');
    }
    toast.success('Note removed');
    setShowDeleteModal(false);
    setNoteToDelete(null);
  };

  return (
    <MuiThemeProvider>
      <div className="max-w-5xl mx-auto p-4">
        {/* Controls: debounced search + create note */}
        <div className="flex flex-wrap gap-3 items-center mb-8 justify-end">
          <TextField
            size="small"
            variant="outlined"
            placeholder="Search notes..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            className="btn btn-primary btn-sm gap-2 hover:scale-105 transition-all duration-200"
            onClick={() => setShowNoteModal(true)}
          >
            <Plus size={16} />
            Note
          </button>
        </div>

        {/* Enhanced Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-4">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-base-content/60">Loading your notes...</p>
            </div>
          </div>
        ) : filteredNotes.length === 0 ? (
          /* Enhanced Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4 animate-bounce">📝</div>
            <h3 className="text-2xl font-bold text-base-content mb-2">
              No notes found
            </h3>
            <p className="text-lg font-medium text-base-content/60 mb-2">
              {q ? 'No notes match your search' : 'No notes yet'}
            </p>
            <p className="text-sm text-base-content/40 mb-6">
              {q
                ? 'Try a different search term'
                : 'Create your first note to get started'}
            </p>
            <button
              className="btn btn-primary gap-2 btn-lg hover:scale-105 transition-all duration-200"
              onClick={() => setShowNoteModal(true)}
            >
              <Plus size={20} />
              Create Note
            </button>
          </div>
        ) : (
          /* Enhanced Notes Grid - max 3 per row */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note, index) => (
              <Zoom
                key={note.id}
                in={!loading}
                timeout={300 + index * 50}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <div
                  className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 hover:border-white border border-base-300 group cursor-pointer overflow-hidden"
                  onClick={() => {
                    setViewNote(note);
                    setShowViewModal(true);
                  }}
                  role="button"
                >
                  <div className="card-body p-6 min-h-48">
                    {/* Row 1: Title | Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="card-title text-base leading-tight flex-1 min-w-0">
                        <span className="block truncate pr-2">
                          {note.title}
                        </span>
                      </h3>
                      {note.category &&
                        (() => {
                          const meta = PRESET_CATEGORIES.find(
                            (p) => p.name === note.category
                          );
                          if (!meta) return null;
                          const Icon =
                            ICONS[(meta.icon as IconKey) || 'Tag'] || Tag;
                          return (
                            <div
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-110 flex-shrink-0"
                              style={{
                                backgroundColor: hexToRgba(meta.color, 0.15),
                                color: meta.color,
                              }}
                            >
                              <Icon size={14} />
                              <span>{meta.name}</span>
                            </div>
                          );
                        })()}
                    </div>

                    {/* Row 2: Time Date */}
                    <div className="text-[12px] opacity-60 flex items-center gap-1 mb-4">
                      <Calendar size={12} />
                      <span>{formatDateTime(note.updatedAt)}</span>
                    </div>

                    {/* Row 3: Content */}
                    <div className="text-sm opacity-80 leading-relaxed flex-grow overflow-hidden">
                      <div
                        className="line-clamp-4"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {note.content || 'No content...'}
                      </div>
                    </div>
                  </div>
                </div>
              </Zoom>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced View Note Modal */}
      {showViewModal && viewNote && (
        <Fade in={showViewModal}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="card w-full max-w-lg bg-base-100 shadow-2xl border border-base-300 animate-in zoom-in-90 duration-300">
              <div className="card-body p-6">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="card-title text-lg font-semibold">
                    View Note
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Title | Category (7/3) */}
                  <div className="grid grid-cols-10 gap-3 items-start">
                    <div className="col-span-7">
                      <TextField
                        fullWidth
                        size="small"
                        label="Title"
                        value={viewNote.title}
                        InputProps={{ readOnly: true }}
                      />
                    </div>
                    <div className="col-span-3">
                      <FormControl fullWidth size="small">
                        <InputLabel id="view-note-category-label">
                          Category
                        </InputLabel>
                        <MuiSelect
                          labelId="view-note-category-label"
                          label="Category"
                          value={
                            viewNote.category
                              ? PRESET_CATEGORIES.find(
                                  (p) => p.name === viewNote.category
                                )?.key || ''
                              : ''
                          }
                          disabled
                        >
                          <MenuItem value="">No category</MenuItem>
                          {PRESET_CATEGORIES.map((p) => (
                            <MenuItem key={`preset-${p.key}`} value={p.key}>
                              {p.name}
                            </MenuItem>
                          ))}
                        </MuiSelect>
                      </FormControl>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="form-control">
                    <TextField
                      fullWidth
                      size="small"
                      label="Content"
                      multiline
                      minRows={6}
                      value={viewNote.content || ''}
                      InputProps={{ readOnly: true }}
                    />
                  </div>
                </div>

                <div className="card-actions justify-end gap-3 mt-8">
                  <button
                    className="btn btn-error transition-all duration-200 hover:scale-105"
                    onClick={async () => {
                      await removeNote(viewNote);
                      setShowViewModal(false);
                      setViewNote(null);
                    }}
                  >
                    Delete
                  </button>
                  <button
                    className="btn btn-secondary gap-2 transition-all duration-200 hover:scale-105"
                    onClick={() => {
                      updateNote(viewNote);
                      setShowViewModal(false);
                      setViewNote(null);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost transition-all duration-200 hover:scale-105"
                    onClick={() => {
                      setShowViewModal(false);
                      setViewNote(null);
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Fade>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && noteToDelete && (
        <Fade in={showDeleteModal}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300 animate-in zoom-in-90 duration-300">
              <div className="card-body p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-error"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-2">Delete Note</h3>
                <p className="text-base-content/70 mb-1">
                  Are you sure you want to delete this note?
                </p>
                <p className="font-medium text-sm mb-6">
                  &ldquo;{noteToDelete.title}&rdquo;
                </p>

                <div className="flex gap-3 justify-center">
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setNoteToDelete(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-error" onClick={confirmDeleteNote}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Fade>
      )}

      {/* Enhanced Create Note Modal */}
      {showNoteModal && (
        <Fade in={showNoteModal}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="card w-full max-w-lg bg-base-100 shadow-2xl border border-base-300 animate-in zoom-in-90 duration-300">
              <div className="card-body p-6">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="card-title text-lg font-semibold">
                    Create New Note
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-10 gap-3 items-start">
                    <div className="col-span-7">
                      <TextField
                        fullWidth
                        size="small"
                        label="Title"
                        value={draftNote.title}
                        onChange={(e) =>
                          setDraftNote((d) => ({ ...d, title: e.target.value }))
                        }
                      />
                    </div>
                    <div className="col-span-3">
                      <FormControl fullWidth size="small">
                        <InputLabel id="create-note-category-label">
                          Category
                        </InputLabel>
                        <MuiSelect
                          labelId="create-note-category-label"
                          label="Category"
                          value={selectedPresetKey}
                          onChange={(e) =>
                            selectCategoryByIdOrPreset(String(e.target.value))
                          }
                        >
                          <MenuItem value="">No category</MenuItem>
                          {PRESET_CATEGORIES.map((p) => (
                            <MenuItem key={`preset-${p.key}`} value={p.key}>
                              {p.name}
                            </MenuItem>
                          ))}
                        </MuiSelect>
                      </FormControl>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="form-control">
                    <TextField
                      fullWidth
                      size="small"
                      label="Content"
                      multiline
                      minRows={6}
                      value={draftNote.content}
                      onChange={(e) =>
                        setDraftNote((d) => ({ ...d, content: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="card-actions justify-end gap-3 mt-8">
                  <button
                    className="btn btn-ghost transition-all duration-200 hover:scale-105"
                    onClick={() => {
                      setShowNoteModal(false);
                      setDraftNote({ title: '', content: '', category: '' });
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary gap-2 transition-all duration-200 hover:scale-105"
                    onClick={submitNote}
                    disabled={!draftNote.title.trim()}
                  >
                    Create Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Fade>
      )}

      {/* Enhanced Edit Note Modal */}
      {showEditModal && (
        <Fade in={showEditModal}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="card w-full max-w-lg bg-base-100 shadow-2xl border border-base-300 animate-in zoom-in-90 duration-300">
              <div className="card-body p-6">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="card-title text-lg font-semibold">
                    Edit Note
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-10 gap-3 items-start">
                    <div className="col-span-7">
                      <TextField
                        fullWidth
                        size="small"
                        label="Title"
                        value={draftNote.title}
                        onChange={(e) =>
                          setDraftNote((d) => ({ ...d, title: e.target.value }))
                        }
                      />
                    </div>
                    <div className="col-span-3">
                      <FormControl fullWidth size="small">
                        <InputLabel id="edit-note-category-label">
                          Category
                        </InputLabel>
                        <MuiSelect
                          labelId="edit-note-category-label"
                          label="Category"
                          value={selectedPresetKey}
                          onChange={(e) =>
                            selectCategoryByIdOrPreset(String(e.target.value))
                          }
                        >
                          <MenuItem value="">No category</MenuItem>
                          {PRESET_CATEGORIES.map((p) => (
                            <MenuItem key={`preset-${p.key}`} value={p.key}>
                              {p.name}
                            </MenuItem>
                          ))}
                        </MuiSelect>
                      </FormControl>
                    </div>
                  </div>
                  <div className="form-control">
                    <TextField
                      fullWidth
                      size="small"
                      label="Content"
                      multiline
                      minRows={6}
                      value={draftNote.content}
                      onChange={(e) =>
                        setDraftNote((d) => ({ ...d, content: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="card-actions justify-end gap-3 mt-8">
                  <button
                    className="btn btn-ghost transition-all duration-200 hover:scale-105"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingNote(null);
                      setDraftNote({ title: '', content: '', category: '' });
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-secondary gap-2 transition-all duration-200 hover:scale-105"
                    onClick={submitEditNote}
                    disabled={!draftNote.title.trim()}
                  >
                    Update Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Fade>
      )}

      {/* Category deletion is disabled for fixed presets */}
    </MuiThemeProvider>
  );
}
