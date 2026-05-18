import { useState, useEffect, type MouseEvent } from 'react';
import Auth from './features/auth/Auth';
import Tavern from './features/tavern/Tavern';
import CharacterSheet from './features/character-sheet/CharacterSheet';
import type { Character } from './types/character';
import { ApiError, fetchWithAuth, setNotifyHandler, setUnauthorizedHandler, setCsrfToken } from './utils/api';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setIsAuthenticated(prev => {
        if (prev) {
          alert('Session expired or invalid. Please log in again.');
        }
        return false;
      });
      setSelectedCharacter(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    setNotifyHandler((message) => setNotification(message));
    return () => setNotifyHandler(null);
  }, []);

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/characters/');
      if (res.ok) {
        setCharacters(await res.json());
        setIsAuthenticated(true);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setNotification(err.detail);
      } else {
        console.error("Error loading characters:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const handleLogout = async () => {
    try {
      await fetchWithAuth('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuthenticated(false);
      setSelectedCharacter(null);
      setCharacters([]);
      setCsrfToken(null);
    }
  };

  const deleteCharacter = async (e: MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this character?')) return;
    try {
      const res = await fetchWithAuth(`/characters/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCharacters(prev => prev.filter(c => c.id !== id));
      }
    } catch (err: unknown) {
      console.error('Deletion error', err);
    }
  };

  if (!isAuthenticated) {
    return <Auth onLogin={() => {
      setIsAuthenticated(true);
      fetchCharacters();
    }} />;
  }

  if (selectedCharacter) {
    return (
      <CharacterSheet
        character={selectedCharacter}
        onBack={() => {
          setSelectedCharacter(null);
          fetchCharacters();
        }}
      />
    );
  }

  return (
    <>
      {notification && (
        <div className="fixed top-4 right-4 z-50 rounded-lg border border-amber-500/40 bg-slate-900 px-4 py-2 text-sm text-amber-300 shadow-lg">
          {notification}
          <button className="ml-3 text-slate-400 hover:text-slate-200" onClick={() => setNotification(null)}>✕</button>
        </div>
      )}
      <Tavern
        characters={characters}
        loading={loading}
        onSelectCharacter={setSelectedCharacter}
        onDeleteCharacter={deleteCharacter}
        onRefresh={fetchCharacters}
        onLogout={handleLogout}
      />
    </>
  );
}