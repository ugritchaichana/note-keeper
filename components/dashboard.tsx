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
import { GithubPicker } from 'react-color';
import { PRESET_CATEGORIES } from '@/lib/presets';

// Types
export type Category = {
  id: string;
  name: string;
  color: string;
  icon?: string;
  sortOrder?: number;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  categoryId?: string | null;
  category?: Category | null;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [orderDraft, setOrderDraft] = useState<string[]>([]);
  const [iconDraft, setIconDraft] = useState<IconKey>('Tag');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewNote, setViewNote] = useState<Note | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [draftNote, setDraftNote] = useState<{
    title: string;
    content: string;
    categoryId: string | '';
  }>({
    title: '',
    content: '',
    categoryId: '',
  });
  const [draftCategory, setDraftCategory] = useState<{
    name: string;
    color: string;
  }>({
    name: '',
    color: '#6366f1',
  });
  const [preset, setPreset] = useState<
    | 'Custom'
    | 'Learning'
    | 'Work'
    | 'Personal'
    | 'Family'
    | 'Activities'
    | 'Health'
    | 'Finance'
    | 'Travel'
    | 'Hobbies'
    | 'Food'
  >('Custom');

  // Map current draftNote.categoryId (DB id) to its preset key for the selects
  const selectedPresetKey = useMemo(() => {
    if (!draftNote.categoryId) return '';
    const cat = categories.find((c) => c.id === draftNote.categoryId);
    if (!cat) return '';
    const match = PRESET_CATEGORIES.find((p) => p.name === cat.name);
    return match ? match.key : '';
  }, [draftNote.categoryId, categories]);

  const fetchAll = async () => {
    try {
      const [notesRes, catsRes] = await Promise.all([
        fetch(`/api/notes?q=${encodeURIComponent(q)}`),
        fetch(`/api/categories`),
      ]);
      if (!notesRes.ok) throw new Error('Failed to load notes');
      if (!catsRes.ok) throw new Error('Failed to load categories');
      const notesData = await notesRes.json();
      let catsData = await catsRes.json();
      // Auto-initialize preset categories if none exist yet
      if (Array.isArray(catsData) && catsData.length === 0) {
        await fetch('/api/categories/init', { method: 'POST' });
        const catsRes2 = await fetch(`/api/categories`);
        if (catsRes2.ok) {
          catsData = await catsRes2.json();
        }
      }
      setNotes(notesData);
      setCategories(catsData);
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
      setDraftNote((d) => ({ ...d, categoryId: '' }));
      return;
    }
    // If matches an existing category id, just select
    const existing = categories.find((c) => c.id === value);
    if (existing) {
      setDraftNote((d) => ({ ...d, categoryId: existing.id }));
      return;
    }
    // Otherwise treat value as preset key; find preset details
    const presetMeta = PRESET_CATEGORIES.find((p) => p.key === value);
    if (!presetMeta) {
      // Fallback: set as none
      setDraftNote((d) => ({ ...d, categoryId: '' }));
      return;
    }
    // If a category with same name already exists (from DB), use it
    const sameName = categories.find((c) => c.name === presetMeta.name);
    if (sameName) {
      setDraftNote((d) => ({ ...d, categoryId: sameName.id }));
      return;
    }
    // Presets missing: try to initialize them, then retry mapping
    try {
      await fetch('/api/categories/init', { method: 'POST' });
      const res = await fetch('/api/categories');
      if (res.ok) {
        const cats: Category[] = await res.json();
        setCategories(cats);
        const byName = cats.find((c) => c.name === presetMeta.name);
        if (byName) {
          setDraftNote((d) => ({ ...d, categoryId: byName.id }));
          return;
        }
      }
      toast.error('Preset categories are not initialized.');
    } catch {
      toast.error('Preset categories are not initialized.');
    }
  };

  // Note: Category creation has been removed; modal is edit-only now.

  const submitNote = async () => {
    if (!draftNote.title) return toast.error('Title is required');
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: draftNote.title,
        content: draftNote.content,
        categoryId: draftNote.categoryId || null,
      }),
    });
    if (!res.ok) return toast.error('Create note failed');
    toast.success('Note created');
    setShowNoteModal(false);
    setDraftNote({ title: '', content: '', categoryId: '' });
    await fetchAll();
  };

  const updateNote = async (note: Note) => {
    setEditingNote(note);
    setDraftNote({
      title: note.title,
      content: note.content,
      categoryId: note.categoryId || '',
    });
    setShowEditModal(true);
  };

  const submitEditNote = async () => {
    if (!editingNote || !draftNote.title)
      return toast.error('Title is required');
    const res = await fetch(`/api/notes/${editingNote.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: draftNote.title,
        content: draftNote.content,
        categoryId: draftNote.categoryId || null,
      }),
    });
    if (!res.ok) return toast.error('Update failed');
    toast.success('Note updated');
    setShowEditModal(false);
    setEditingNote(null);
    setDraftNote({ title: '', content: '', categoryId: '' });
    await fetchAll();
  };

  const removeNote = async (note: Note) => {
    if (!confirm('Delete note?')) return;
    const res = await fetch(`/api/notes/${note.id}`, { method: 'DELETE' });
    if (!res.ok) return toast.error('Delete failed');
    toast.success('Note removed');
    await fetchAll();
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
                      {note.category && (
                        <div
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-110 flex-shrink-0"
                          style={{
                            backgroundColor: hexToRgba(
                              note.category.color,
                              0.15
                            ),
                            color: note.category.color,
                          }}
                        >
                          {(() => {
                            const key = (note.category?.icon ||
                              'Tag') as keyof typeof ICONS;
                            const Icon = ICONS[key] || Tag;
                            return <Icon size={14} />;
                          })()}
                          <span>{note.category.name}</span>
                        </div>
                      )}
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
                            (viewNote.category &&
                              (PRESET_CATEGORIES.find(
                                (p) => p.name === viewNote.category!.name
                              )?.key ||
                                '')) ||
                            ''
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
                      setDraftNote({ title: '', content: '', categoryId: '' });
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
                  {/* Title | Category (7/3) */}
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
                      setShowEditModal(false);
                      setEditingNote(null);
                      setDraftNote({ title: '', content: '', categoryId: '' });
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

      {/* Category Modal (Edit-only) */}
      {showCategoryModal && editingCategoryId && (
        <Fade in={showCategoryModal}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300 animate-in zoom-in-90 duration-300">
              <div className="card-body p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="avatar placeholder">
                    <div className="bg-accent/10 text-accent rounded-lg w-10 h-10">
                      <Tag size={20} />
                    </div>
                  </div>
                  <h2 className="card-title text-lg font-semibold">
                    Edit Category
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* Preset Selector */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Preset</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={preset}
                      onChange={(e) => {
                        const val = e.target.value as typeof preset;
                        setPreset(val);
                        if (val === 'Custom') return;
                        const p = PRESET_CATEGORIES.find((x) => x.key === val);
                        if (p) {
                          setDraftCategory({ name: p.name, color: p.color });
                          setIconDraft(p.icon as IconKey);
                        }
                      }}
                    >
                      <option value="Custom">Custom</option>
                      {PRESET_CATEGORIES.map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Category Name
                      </span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered focus:input-accent transition-all duration-200"
                      placeholder="Enter category name..."
                      value={draftCategory.name}
                      disabled={preset !== 'Custom'}
                      onChange={(e) =>
                        setDraftCategory((d) => ({
                          ...d,
                          name: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Choose Color
                      </span>
                    </label>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                        <div
                          className="badge"
                          style={{
                            backgroundColor: hexToRgba(
                              draftCategory.color,
                              0.15
                            ),
                            color: draftCategory.color,
                          }}
                        >
                          {(() => {
                            const Icon = ICONS[iconDraft] || Tag;
                            return <Icon size={14} className="mr-1" />;
                          })()}
                          {draftCategory.name || 'Preview'}
                        </div>
                        <div className="font-mono text-sm opacity-70">
                          {draftCategory.color}
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-lg border border-base-300">
                        <GithubPicker
                          color={draftCategory.color}
                          onChange={(color) =>
                            setDraftCategory((d) => ({
                              ...d,
                              color: color.hex,
                            }))
                          }
                          triangle="hide"
                          width="100%"
                          colors={[
                            '#6366f1',
                            '#8b5cf6',
                            '#ec4899',
                            '#ef4444',
                            '#f97316',
                            '#f59e0b',
                            '#eab308',
                            '#84cc16',
                            '#22c55e',
                            '#10b981',
                            '#06b6d4',
                            '#0ea5e9',
                            '#3b82f6',
                            '#d946ef',
                            '#f43f5e',
                            '#64748b',
                            '#6b7280',
                            '#374151',
                          ]}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Icon Picker */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Icon</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={iconDraft}
                      disabled={preset !== 'Custom'}
                      onChange={(e) =>
                        setIconDraft(e.target.value as keyof typeof ICONS)
                      }
                    >
                      {Object.keys(ICONS).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <div className="text-xs opacity-60 mt-1">
                      Uses Lucide icon names
                    </div>
                  </div>
                </div>

                <div className="card-actions justify-end gap-3 mt-8">
                  <button
                    className="btn btn-ghost transition-all duration-200 hover:scale-105"
                    onClick={() => {
                      setShowCategoryModal(false);
                      setDraftCategory({ name: '', color: '#6366f1' });
                      setEditingCategoryId(null);
                      setIconDraft('Tag');
                      setPreset('Custom');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-accent gap-2 transition-all duration-200 hover:scale-105"
                    onClick={async () => {
                      const res = await fetch(
                        `/api/categories/${editingCategoryId}`,
                        {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: draftCategory.name,
                            color: draftCategory.color,
                            icon: iconDraft,
                          }),
                        }
                      );
                      if (!res.ok) return toast.error('Update failed');
                      toast.success('Category updated');
                      setShowCategoryModal(false);
                      setEditingCategoryId(null);
                      setDraftCategory({ name: '', color: '#6366f1' });
                      setIconDraft('Tag');
                      setPreset('Custom');
                      await fetchAll();
                    }}
                    disabled={!draftCategory.name.trim()}
                  >
                    <Tag size={16} />
                    Update Category
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Fade>
      )}

      {/* Category Manager Overlay */}
      {showCategoryManager && (
        <Fade in={showCategoryManager}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="card w-full max-w-3xl bg-base-100 shadow-2xl border border-base-300 animate-in zoom-in-90 duration-300">
              <div className="card-body p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="card-title">Manage Categories</h2>
                  <div className="join">
                    <button
                      className="btn btn-secondary btn-sm join-item"
                      onClick={() => setShowCategoryModal(true)}
                    >
                      <Plus size={14} />
                      New
                    </button>
                    <button
                      className={`btn btn-sm join-item ${
                        isReordering ? 'btn-warning' : 'btn-outline'
                      }`}
                      onClick={() => {
                        setIsReordering((v) => !v);
                        setOrderDraft(categories.map((c) => c.id));
                      }}
                    >
                      {isReordering ? 'Done' : 'Reorder'}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm join-item"
                      onClick={() => setShowCategoryManager(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* List with drag-and-drop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(isReordering
                    ? orderDraft
                        .map((id) => categories.find((c) => c.id === id)!)
                        .filter(Boolean)
                    : categories
                  ).map((c) => (
                    <div
                      key={c!.id}
                      className={`card border border-base-300 shadow-sm transition-all ${
                        isReordering ? 'cursor-move hover:shadow-md' : ''
                      }`}
                      draggable={isReordering}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', c!.id);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        if (!isReordering) return;
                        const from = e.dataTransfer.getData('text/plain');
                        const to = c!.id;
                        if (!from || from === to) return;
                        setOrderDraft((prev) => {
                          const arr = prev.slice();
                          const fromIdx = arr.indexOf(from);
                          const toIdx = arr.indexOf(to);
                          if (fromIdx === -1 || toIdx === -1) return prev;
                          arr.splice(toIdx, 0, ...arr.splice(fromIdx, 1));
                          return arr;
                        });
                      }}
                    >
                      <div className="card-body p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="badge gap-1"
                              style={{
                                backgroundColor: c!.color,
                                color: '#fff',
                              }}
                            >
                              {(() => {
                                const key = (c!.icon || 'Tag') as IconKey;
                                const Icon = ICONS[key] || Tag;
                                return <Icon size={12} />;
                              })()}
                              {c!.name}
                            </div>
                          </div>
                          <div className="join">
                            <button
                              className="btn btn-ghost btn-xs join-item"
                              onClick={async () => {
                                // open edit modal prefilled
                                setShowCategoryModal(true);
                                setEditingCategoryId(c!.id);
                                setDraftCategory({
                                  name: c!.name,
                                  color: c!.color,
                                });
                                setIconDraft(
                                  (c!.icon || 'Tag') as keyof typeof ICONS
                                );
                                setPreset('Custom');
                                // Optional: store editing state if you want separate edit
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-ghost btn-xs join-item text-error"
                              onClick={async () => {
                                if (!confirm('Delete this category?')) return;
                                const res = await fetch(
                                  `/api/categories/${c!.id}`,
                                  { method: 'DELETE' }
                                );
                                if (!res.ok)
                                  return toast.error('Delete failed');
                                toast.success('Category removed');
                                await fetchAll();
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Save order */}
                {isReordering && (
                  <div className="card-actions justify-end mt-6">
                    <button
                      className="btn btn-primary"
                      onClick={async () => {
                        await fetch('/api/categories/reorder', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ order: orderDraft }),
                        });
                        toast.success('Order saved');
                        setIsReordering(false);
                        await fetchAll();
                      }}
                    >
                      Save Order
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Fade>
      )}
    </MuiThemeProvider>
  );
}
