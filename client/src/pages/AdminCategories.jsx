import { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ApiError } from '../services/client';
import {
  getEventCategories,
  createEventCategory,
  updateEventCategory,
  deleteEventCategory
} from '../services/event-categories';


const inputClass = 
  'border border-gray-300 rounded-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getEventCategories();
      setCategories(data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setActionError('');
    setCreating(true);
    try {
      await createEventCategory(newName.trim());
      setNewName('');
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not create category.');
    } finally {
      setCreating(false);
    }
  }

  function startEdit(cat) {
    setEditingId(cat.category_id);
    setEditingName(cat.name);
  }

  async function saveEdit(id) {
    if (!editingName.trim()) return;
    setActionError('');
    setSavingId(id);
    try {
      await updateEventCategory(id, editingName.trim());
      setEditingId(null);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not rename category.');
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(cat) {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    setActionError('');
    setDeletingId(cat.category_id);
    try {
      await deleteEventCategory(cat.category_id);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not delete category.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name..."
          className={`${inputClass} flex-1 max-w-sm`}
        />
        <Button type="submit" disabled={creating || !newName.trim()}>
          {creating ? 'Adding...' : 'Add Category'}
        </Button>
      </form>

      {actionError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-card px-3 py-2">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="h-48 bg-gray-100 rounded-card animate-pulse" />
      ) : error ? (
        <div className="text-center py-12 bg-gray-50 rounded-card border border-gray-200">
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-card border border-gray-200">
          <p className="text-sm text-slate-500">No categories yet.</p>
        </div>
      ) : (
        <Card className="divide-y divide-gray-100">
          {categories.map((cat) => (
            <div key={cat.category_id} className="flex items-center justify-between px-4 py-3">
              {editingId === cat.category_id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className={`${inputClass} flex-1 max-w-sm mr-3`}
                  autoFocus
                />
              ) : (
                <span className="text-sm text-slate-800 font-medium">{cat.name}</span>
              )}

              <div className="flex gap-2 shrink-0">
                {editingId === cat.category_id ? (
                  <>
                    <Button
                      variant="outline"
                      disabled={savingId === cat.category_id || !editingName.trim()}
                      onClick={() => saveEdit(cat.category_id)}
                    >
                      {savingId === cat.category_id ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => startEdit(cat)}>Rename</Button>
                    <Button
                      variant="danger"
                      disabled={deletingId === cat.category_id}
                      onClick={() => handleDelete(cat)}
                    >
                      {deletingId === cat.category_id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
