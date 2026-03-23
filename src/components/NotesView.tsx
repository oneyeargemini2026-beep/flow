import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HexColorPicker } from 'react-colorful';
import { Pin, Palette, Trash2, Check } from 'lucide-react';
import { useAppContext } from '../store';
import { Note } from '../types';
import { getLocalISOString } from '../utils';

const COLORS = [
  '#ffffff', '#f28b82', '#fbbc04', '#fff475', '#ccff90', 
  '#a7ffeb', '#cbf0f8', '#aecbfa', '#d7aefb', '#fdcfe8', 
  '#e6c9a8', '#e8eaed'
];

const DARK_COLORS = [
  '#202124', '#5c2b29', '#614a19', '#635d19', '#345920', 
  '#16504b', '#2d555e', '#1e3a5f', '#42275e', '#5b2245', 
  '#442f19', '#3c3f43'
];

const NoteCard: React.FC<{ 
  note: Note; 
  onEdit: (note: Note) => void;
  onTogglePin: (id: string, e?: React.MouseEvent) => void;
  onChangeColor: (id: string, color: string, e?: React.MouseEvent) => void;
  onDelete: (id: string, e?: React.MouseEvent) => void;
}> = ({ note, onEdit, onTogglePin, onChangeColor, onDelete }) => {
  const [showPalette, setShowPalette] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      className="rounded-xl border border-border-strong p-4 cursor-pointer relative group break-inside-avoid mb-4 overflow-hidden"
      style={{ backgroundColor: note.color }}
      onClick={() => onEdit(note)}
    >
      <button 
        onClick={(e) => onTogglePin(note.id, e)}
        className={`absolute top-3 right-3 p-1.5 rounded-full hover:bg-black/10 transition-opacity ${note.pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      >
        <Pin size={16} className={note.pinned ? 'fill-current' : ''} />
      </button>
      
      {note.title && <h3 className="font-medium text-base mb-2 pr-6 whitespace-pre-wrap">{note.title}</h3>}
      {note.content && <p className="text-sm text-text-muted whitespace-pre-wrap leading-relaxed">{note.content}</p>}
      
      <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowPalette(!showPalette); }}
            className="p-1.5 rounded-full hover:bg-black/10 text-text-muted"
          >
            <Palette size={16} />
          </button>
          {showPalette && (
            <div 
              className="absolute bottom-full right-0 mb-2 bg-bg border border-border-strong rounded-lg p-2 shadow-xl z-10"
              onClick={e => e.stopPropagation()}
            >
              <HexColorPicker color={note.color} onChange={(c) => onChangeColor(note.id, c)} />
            </div>
          )}
        </div>
        <button 
          onClick={(e) => onDelete(note.id, e)}
          className="p-1.5 rounded-full hover:bg-black/10 text-text-muted"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
};

export const NotesView = () => {
  const { notes, setNotes } = useAppContext();
  const [isComposing, setIsComposing] = useState(false);
  const [composeTitle, setComposeTitle] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [composeColor, setComposeColor] = useState(DARK_COLORS[0]);
  const [composePinned, setComposePinned] = useState(false);
  const [showComposePalette, setShowComposePalette] = useState(false);
  
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showEditPalette, setShowEditPalette] = useState(false);
  
  const composeRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLDivElement>(null);

  // Close compose on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (composeRef.current && !composeRef.current.contains(e.target as Node)) {
        saveCompose();
      }
    };
    if (isComposing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isComposing, composeTitle, composeContent, composeColor, composePinned]);

  const saveCompose = () => {
    if (composeTitle.trim() || composeContent.trim()) {
      const newNote: Note = {
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: composeTitle,
        content: composeContent,
        color: composeColor,
        pinned: composePinned,
        createdAt: getLocalISOString(),
        updatedAt: getLocalISOString(),
      };
      setNotes(prev => [newNote, ...prev]);
    }
    setIsComposing(false);
    setComposeTitle('');
    setComposeContent('');
    setComposeColor(DARK_COLORS[0]);
    setComposePinned(false);
    setShowComposePalette(false);
  };

  const saveEdit = () => {
    if (editingNote) {
      setNotes(prev => prev.map(n => n.id === editingNote.id ? { ...editingNote, updatedAt: getLocalISOString() } : n));
      setEditingNote(null);
      setShowEditPalette(false);
    }
  };

  const deleteNote = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, deleted: true, updatedAt: getLocalISOString() } : n));
    if (editingNote?.id === id) setEditingNote(null);
  };

  const togglePin = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned, updatedAt: getLocalISOString() } : n));
  };

  const changeColor = (id: string, color: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, color, updatedAt: getLocalISOString() } : n));
  };

  const activeNotes = notes.filter(n => !n.deleted);
  const pinnedNotes = activeNotes.filter(n => n.pinned);
  const otherNotes = activeNotes.filter(n => !n.pinned);

  return (
    <div className="flex-1 overflow-y-auto bg-bg p-4 md:p-8">
      <div className="max-w-3xl mx-auto mb-12">
        <div 
          ref={composeRef}
          className="bg-bg2 border border-border-strong rounded-xl shadow-sm overflow-hidden transition-all duration-200"
          style={{ backgroundColor: composeColor }}
        >
          {isComposing ? (
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <input
                  type="text"
                  placeholder="Title"
                  value={composeTitle}
                  onChange={e => setComposeTitle(e.target.value)}
                  className="w-full bg-transparent border-none outline-none font-medium text-text-main placeholder:text-text-faint"
                  autoFocus
                />
                <button 
                  onClick={() => setComposePinned(!composePinned)}
                  className="p-1.5 rounded-full hover:bg-black/10 text-text-muted"
                >
                  <Pin size={18} className={composePinned ? 'fill-current' : ''} />
                </button>
              </div>
              <textarea
                placeholder="Take a note..."
                value={composeContent}
                onChange={e => setComposeContent(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm text-text-main placeholder:text-text-faint resize-none min-h-[100px]"
              />
              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-1">
                  <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowComposePalette(!showComposePalette); }}
                      className="p-2 rounded-full hover:bg-black/10 text-text-muted"
                    >
                      <Palette size={18} />
                    </button>
                    {showComposePalette && (
                      <div 
                        className="absolute top-full left-0 mt-1 bg-bg border border-border-strong rounded-lg p-2 shadow-xl z-10"
                        onClick={e => e.stopPropagation()}
                      >
                        <HexColorPicker color={composeColor} onChange={setComposeColor} />
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={saveCompose}
                  className="px-4 py-1.5 text-sm font-medium hover:bg-black/10 rounded-md transition-colors"
                >
                  Enter
                </button>
              </div>
            </div>
          ) : (
            <div 
              className="p-3.5 px-4 flex items-center text-text-faint cursor-text"
              onClick={() => setIsComposing(true)}
            >
              <span className="flex-1 font-medium">Take a note...</span>
              <div className="flex gap-2">
                <button className="p-2 rounded-full hover:bg-black/10 text-text-muted transition-colors">
                  <Check size={18} />
                </button>
                <button className="p-2 rounded-full hover:bg-black/10 text-text-muted transition-colors">
                  <Palette size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {pinnedNotes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-faint mb-4 ml-2">Pinned</h2>
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
            <AnimatePresence>
              {pinnedNotes.map(note => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  onEdit={setEditingNote}
                  onTogglePin={togglePin}
                  onChangeColor={changeColor}
                  onDelete={deleteNote}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {otherNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && <h2 className="text-xs font-bold uppercase tracking-wider text-text-faint mb-4 ml-2">Others</h2>}
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
            <AnimatePresence>
              {otherNotes.map(note => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  onEdit={setEditingNote}
                  onTogglePin={togglePin}
                  onChangeColor={changeColor}
                  onDelete={deleteNote}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={saveEdit}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              style={{ backgroundColor: editingNote.color }}
            >
              <div className="p-5 flex-1 overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <input
                    type="text"
                    placeholder="Title"
                    value={editingNote.title}
                    onChange={e => setEditingNote({ ...editingNote, title: e.target.value })}
                    className="w-full bg-transparent border-none outline-none text-xl font-medium text-text-main placeholder:text-text-faint"
                  />
                  <button 
                    onClick={() => setEditingNote({ ...editingNote, pinned: !editingNote.pinned })}
                    className="p-2 rounded-full hover:bg-black/10 text-text-muted shrink-0 ml-2"
                  >
                    <Pin size={20} className={editingNote.pinned ? 'fill-current' : ''} />
                  </button>
                </div>
                <textarea
                  placeholder="Note"
                  value={editingNote.content}
                  onChange={e => setEditingNote({ ...editingNote, content: e.target.value })}
                  className="w-full bg-transparent border-none outline-none text-base text-text-main placeholder:text-text-faint resize-none min-h-[300px]"
                />
              </div>
              <div className="p-3 px-4 flex justify-between items-center border-t border-black/10">
                <div className="flex gap-2">
                  <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowEditPalette(!showEditPalette); }}
                      className="p-2 rounded-full hover:bg-black/10 text-text-muted"
                    >
                      <Palette size={20} />
                    </button>
                    {showEditPalette && (
                      <div 
                        className="absolute bottom-full left-0 mb-2 bg-bg border border-border-strong rounded-lg p-2 shadow-xl z-10"
                        onClick={e => e.stopPropagation()}
                      >
                        <HexColorPicker color={editingNote.color} onChange={(c) => setEditingNote({ ...editingNote, color: c })} />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => deleteNote(editingNote.id)}
                    className="p-2 rounded-full hover:bg-black/10 text-text-muted"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <button 
                  onClick={saveEdit}
                  className="px-6 py-2 text-sm font-medium hover:bg-black/10 rounded-lg transition-colors"
                >
                  Enter
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
