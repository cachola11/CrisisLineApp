import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../services/userService'; // Assuming you have a way to get users

interface AssignSupervisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (supervisorId: string | null, supervisorName: string | null, supervisorEmoji: string | null) => void;
  isLoading?: boolean;
}

const AssignSupervisorModal: React.FC<AssignSupervisorModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  isLoading = false,
}) => {
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('');
  const [manualSupervisorName, setManualSupervisorName] = useState<string>('');
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Common emojis for supervisors
  const commonEmojis = ['👨‍⚕️', '👩‍⚕️', '👨‍💼', '👩‍💼', '👨‍🏫', '👩‍🏫', '👨‍🔬', '👩‍🔬', '👨‍⚖️', '👩‍⚖️', '👨‍🎓', '👩‍🎓', '👨‍💻', '👩‍💻', '👨‍🚀', '👩‍🚀', '👨‍🎨', '👩‍🎨', '👨‍🎤', '👩‍🎤', '👨‍🎭', '👩‍🎭', '👨‍🏭', '👩‍🏭', '👨‍🔧', '👩‍🔧', '👨‍🚒', '👩‍🚒', '👨‍✈️', '👩‍✈️', '👨‍🚁', '👩‍🚁', '👨‍🛥️', '👩‍🛥️', '👨‍🛩️', '👩‍🛩️', '👨‍🚂', '👩‍🚂', '👨‍🚌', '👩‍🚌', '👨‍🚗', '👩‍🚗', '👨‍🚙', '👩‍🚙', '👨‍🚚', '👩‍🚚', '👨‍🚛', '👩‍🚛', '👨‍🚜', '👩‍🚜', '👨‍🏎️', '👩‍🏎️', '👨‍🏍️', '👩‍🏍️', '👨‍🛵', '👩‍🛵', '👨‍🛴', '👩‍🛴', '👨‍🚲', '👩‍🚲', '👨‍🛶', '👩‍🛶', '👨‍🚣', '👩‍🚣', '👨‍🏊', '👩‍🏊', '👨‍🏄', '👩‍🏄', '👨‍🏃', '👩‍🏃', '👨‍🚶', '👩‍🚶', '👨‍🏋️', '👩‍🏋️', '👨‍🤸', '👩‍🤸', '👨‍⛹️', '👩‍⛹️', '👨‍🤺', '👩‍🤺', '👨‍🤾', '👩‍🤾', '👨‍🏇', '👩‍🏇', '👨‍🏂', '👩‍🏂', '👨‍🏌️', '👩‍🏌️', '👨‍🏄‍♂️', '👩‍🏄‍♀️', '👨‍🚴', '👩‍🚴', '👨‍🚵', '👩‍🚵', '👨‍🤽', '👩‍🤽', '👨‍🏊‍♂️', '👩‍🏊‍♀️', '👨‍🚣‍♂️', '👩‍🚣‍♀️', '👨‍🏊‍♂️', '👩‍🏊‍♀️', '👨‍🏄‍♂️', '👩‍🏄‍♀️', '👨‍🚴‍♂️', '👩‍🚴‍♀️', '👨‍🚵‍♂️', '👩‍🚵‍♀️', '👨‍🤽‍♂️', '👩‍🤽‍♀️', '👨‍🏊‍♂️', '👩‍🏊‍♀️', '👨‍🚣‍♂️', '👩‍🚣‍♀️', '👨‍🏊‍♂️', '👩‍🏊‍♀️', '👨‍🏄‍♂️', '👩‍🏄‍♀️', '👨‍🚴‍♂️', '👩‍🚴‍♀️', '👨‍🚵‍♂️', '👩‍🚵‍♀️', '👨‍🤽‍♂️', '👩‍🤽‍♀️'];

  useEffect(() => {
    if (isOpen) {
      const fetchSupervisors = async () => {
        setLoadingUsers(true);
        try {
          const allUsers = await getAllUsers();
          // Filter for Coordenador or Administrador roles
          const supervisorUsers = allUsers.filter(
            (user: any) => user.role === 'Coordenador' || user.role === 'Administrador'
          );
          setSupervisors(supervisorUsers);
        } catch (error) {
          console.error("Failed to fetch supervisors:", error);
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchSupervisors();
    }
  }, [isOpen]);

  const handleAssign = () => {
    const selectedUser = supervisors.find(s => s.id === selectedSupervisor);
    const finalName = manualSupervisorName || selectedUser?.displayName || null;
    const finalEmoji = selectedEmoji || null;
    
    onAssign(selectedUser?.id || null, finalName, finalEmoji);
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setShowEmojiPicker(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md relative">
        <h2 className="text-2xl font-bold text-brand-700 mb-6">Atribuir Supervisor</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold text-brand-700">Selecionar da Lista</label>
            {loadingUsers ? (
              <p className="text-brand-500">A carregar supervisores...</p>
            ) : (
              <select
                className="border rounded-full px-4 py-2 w-full bg-white/80 border-brand-200 focus:border-brand-500 focus:ring-brand-500 text-brand-700"
                value={selectedSupervisor}
                onChange={(e) => {
                  setSelectedSupervisor(e.target.value);
                }}
              >
                <option value="">Ninguém (remover supervisor)</option>
                {supervisors.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} ({user.idNumber})
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <hr className="flex-grow border-t border-brand-200" />
            <span className="text-brand-500 font-semibold">OU</span>
            <hr className="flex-grow border-t border-brand-200" />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-brand-700">Inserir Nome Manualmente (Opcional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="border rounded-full px-4 py-2 flex-1 bg-white/80 border-brand-200 focus:border-brand-500 focus:ring-brand-500 text-brand-700 placeholder:text-brand-300"
                value={manualSupervisorName}
                onChange={(e) => setManualSupervisorName(e.target.value)}
                placeholder="Opcional: substituir nome"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="px-3 py-2 border rounded-full bg-white/80 border-brand-200 hover:bg-brand-50 transition-colors"
                title="Adicionar emoji"
              >
                😊
              </button>
            </div>
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="mt-2 p-3 border border-brand-200 rounded-lg bg-white/90 max-h-40 overflow-y-auto">
                <div className="grid grid-cols-8 gap-1">
                  {commonEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="p-1 hover:bg-brand-100 rounded text-lg transition-colors"
                      title={`Adicionar ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Preview */}
            {(selectedSupervisor || manualSupervisorName) && (
              <div className="mt-2 p-2 bg-brand-50 rounded-lg">
                <span className="text-sm text-brand-600">Pré-visualização:</span>
                <div className="text-base font-semibold text-brand-800">
                  {selectedEmoji} {manualSupervisorName || supervisors.find(s => s.id === selectedSupervisor)?.displayName}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 rounded-full font-bold text-brand-700 bg-softpink-100 border border-brand-200 hover:bg-brand-100 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={isLoading}
            className="px-6 py-2 rounded-full font-bold text-white bg-brand-500 hover:bg-brand-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'A atribuir...' : 'Atribuir'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignSupervisorModal; 