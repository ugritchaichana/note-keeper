'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Filter as FilterIcon, Search as SearchIcon } from 'lucide-react';

export type Category = { id: string; name: string; color: string };
export type Note = {
  id: string;
  title: string;
  content: string;
  categoryId?: string | null;
  category?: Category | null;
};

export function Dashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchIn, setSearchIn] = useState<{
    title: boolean;
    category: boolean;
    content: boolean;
  }>({
    title: true,
    category: true,
    content: true,
  });
  const [loading, setLoading] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
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
    color: '#a3a3a3',
  });

  const fetchAll = async () => {
    try {
      const searchInParam = Object.entries(searchIn)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(',');
      const categoryIdsParam = selectedCategories.join(',');
      const [notesRes, catsRes] = await Promise.all([
        fetch(
          `/api/notes?q=${encodeURIComponent(
            q
          )}&categoryIds=${encodeURIComponent(
            categoryIdsParam
          )}&searchIn=${encodeURIComponent(searchInParam)}`
        ),
        fetch(`/api/categories`),
      ]);
      if (!notesRes.ok) throw new Error('Failed to load notes');
      if (!catsRes.ok) throw new Error('Failed to load categories');
      setNotes(await notesRes.json());
      setCategories(await catsRes.json());
    } catch (e: any) {
      toast.error(e.message || 'Load failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredNotes = useMemo(() => notes, [notes]);

  const submitCategory = async () => {
    if (!draftCategory.name) return toast.error('Category name is required');
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: draftCategory.name,
        color: draftCategory.color,
      }),
    });
    if (!res.ok) return toast.error('Create category failed');
    toast.success('Category created');
    setShowCategoryModal(false);
    setDraftCategory({ name: '', color: '#a3a3a3' });
    await fetchAll();
  };

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
    const title = prompt('Edit title', note.title) ?? note.title;
    const content = prompt('Edit content', note.content) ?? note.content;
    const res = await fetch(`/api/notes/${note.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content,
        categoryId: note.categoryId ?? null,
      }),
    });
    if (!res.ok) return toast.error('Update failed');
    toast.success('Note updated');
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
    <>
      <div className="max-w-5xl mx-auto p-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-2 items-center mb-6 justify-end">
          {/* Filter dropdown with checkboxes */}
          <div className="dropdown dropdown-bottom dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-sm">
              <FilterIcon size={16} className="mr-1" />
              Filter
            </div>
            <div
              tabIndex={0}
              className="dropdown-content z-[1] p-3 shadow bg-base-100 rounded-box w-64"
            >
              <div className="mb-2 text-xs opacity-70">Categories</div>
              <label className="label cursor-pointer py-1">
                <span className="label-text">All</span>
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={selectedCategories.length === 0}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedCategories([]);
                  }}
                />
              </label>
              <div className="max-h-40 overflow-auto pr-1">
                {categories.map((c) => {
                  const checked = selectedCategories.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className="label cursor-pointer py-1 gap-2"
                    >
                      <span className="label-text" style={{ color: c.color }}>
                        {c.name}
                      </span>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={checked}
                        onChange={(e) => {
                          setSelectedCategories((prev) =>
                            e.target.checked
                              ? [...prev, c.id]
                              : prev.filter((id) => id !== c.id)
                          );
                        }}
                      />
                    </label>
                  );
                })}
              </div>
              <div className="divider my-2" />
              <div className="mb-2 text-xs opacity-70">Search in</div>
              {(
                [
                  ['title', 'Title'],
                  ['category', 'Category'],
                  ['content', 'Detail'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="label cursor-pointer py-1">
                  <span className="label-text">{label}</span>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={searchIn[key]}
                    onChange={(e) =>
                      setSearchIn((s) => ({ ...s, [key]: e.target.checked }))
                    }
                  />
                </label>
              ))}
              <button
                className="btn btn-sm btn-primary w-full mt-2"
                onClick={fetchAll}
              >
                Apply
              </button>
            </div>
          </div>

          {/* Search with helper */}
          <div className="join">
            <input
              className="input input-sm input-bordered join-item w-56"
              placeholder="Search title/category/detail"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAll()}
            />
            <button className="btn btn-sm join-item" onClick={fetchAll}>
              <SearchIcon size={16} className="mr-1" />
              Search
            </button>
          </div>

          {/* Add actions open modals */}
          <button className="btn btn-sm" onClick={() => setShowNoteModal(true)}>
            Add note
          </button>
          <button
            className="btn btn-sm"
            onClick={() => setShowCategoryModal(true)}
          >
            Add category
          </button>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="text-center text-sm opacity-70">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredNotes.map((n) => (
              <div key={n.id} className="card bg-base-100 shadow">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <h2 className="card-title truncate max-w-[70%]">
                      {n.title}
                    </h2>
                    {n.category && (
                      <span
                        className="badge"
                        style={{
                          backgroundColor: n.category.color,
                          color: 'white',
                        }}
                      >
                        {n.category.name}
                      </span>
                    )}
                  </div>
                  <div className="border rounded p-3 h-40 overflow-auto whitespace-pre-wrap">
                    {n.content}
                  </div>
                  <div className="card-actions justify-end">
                    <button
                      className="btn btn-sm"
                      onClick={() => updateNote(n)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-error"
                      onClick={() => removeNote(n)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Add note</h2>
              <input
                className="input input-bordered"
                placeholder="Title"
                value={draftNote.title}
                onChange={(e) =>
                  setDraftNote((d) => ({ ...d, title: e.target.value }))
                }
              />
              <textarea
                className="textarea textarea-bordered h-32"
                placeholder="Detail"
                value={draftNote.content}
                onChange={(e) =>
                  setDraftNote((d) => ({ ...d, content: e.target.value }))
                }
              />
              <select
                className="select select-bordered"
                value={draftNote.categoryId}
                onChange={(e) =>
                  setDraftNote((d) => ({ ...d, categoryId: e.target.value }))
                }
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="card-actions justify-end">
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowNoteModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={submitNote}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Add category</h2>
              <input
                className="input input-bordered"
                placeholder="Name"
                value={draftCategory.name}
                onChange={(e) =>
                  setDraftCategory((d) => ({ ...d, name: e.target.value }))
                }
              />
              <input
                className="input input-bordered"
                placeholder="#a3a3a3"
                value={draftCategory.color}
                onChange={(e) =>
                  setDraftCategory((d) => ({ ...d, color: e.target.value }))
                }
              />
              <div className="card-actions justify-end">
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowCategoryModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={submitCategory}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
