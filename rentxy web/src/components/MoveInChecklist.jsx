import React, { useState, useEffect } from 'react';
import { CheckSquare, ChevronDown, ChevronUp, FileText, Camera, Key, CheckCircle2 } from 'lucide-react';

const MoveInChecklist = ({ booking }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Try to load state from localStorage so it persists across reloads
  const storageKey = `checklist_${booking.id}`;
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', title: 'Sign Rent Agreement', completed: false, icon: <FileText size={16} className="text-blue-500" /> },
      { id: '2', title: 'Pay Security Deposit', completed: false, icon: <span className="text-green-500 font-bold text-sm">₹</span> },
      { id: '3', title: 'Take photos of existing damages', completed: false, icon: <Camera size={16} className="text-purple-500" /> },
      { id: '4', title: 'Collect Keys from Owner', completed: false, icon: <Key size={16} className="text-amber-500" /> },
      { id: '5', title: 'Setup Wi-Fi / Electricity', completed: false, icon: <CheckCircle2 size={16} className="text-indigo-500" /> },
    ];
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
  }, [tasks, storageKey]);

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const progress = Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);

  return (
    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <CheckSquare className="text-primary-600" size={18} />
          <span className="font-bold text-gray-800 text-sm">Move-in Checklist</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">{progress}%</span>
          {expanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
        </div>
      </button>
      
      {expanded && (
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
            <div className="bg-primary-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
          
          <div className="space-y-2">
            {tasks.map(task => (
              <label key={task.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                <input 
                  type="checkbox" 
                  checked={task.completed} 
                  onChange={() => toggleTask(task.id)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 border-gray-300"
                />
                <div className={`w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0 ${task.completed ? 'opacity-50' : ''}`}>
                  {task.icon}
                </div>
                <span className={`text-sm font-medium transition-all ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {task.title}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoveInChecklist;
