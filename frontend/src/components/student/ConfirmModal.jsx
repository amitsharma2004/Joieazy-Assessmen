import React, { useState } from 'react';
import api from '../../utils/api';
import { CheckCircleIcon, XMarkIcon, ExclamationIcon } from '../common/Icons';

/**
 * Two-step submission confirmation modal.
 * Step 1: "Yes, I have submitted" button
 * Step 2: Final confirm after API returns step=1
 */
const ConfirmModal = ({ assignment, groups, onClose, onSuccess }) => {
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id || '');
  const [step, setStep] = useState(1); // 1 = initial, 2 = first click done, need final confirm
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleConfirm = async () => {
    if (!selectedGroup) return setError('Please select a group');
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/submissions/confirm', {
        assignment_id: assignment.id,
        group_id: selectedGroup
      });

      if (data.step === 1) {
        // First click — show final confirm step
        setStep(2);
        setMessage(data.message);
      } else {
        // Second click — confirmed!
        onSuccess();
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to confirm';
      if (msg.includes('already confirmed')) {
        onSuccess(); // already done
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Confirm Submission</h2>
            <p className="text-sm text-gray-500 mt-0.5">{assignment.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Please confirm that your group has uploaded the assignment to OneDrive
              {assignment.onedrive_link && (
                <>
                  {' '}(
                  <a href={assignment.onedrive_link} target="_blank" rel="noreferrer"
                    className="text-blue-500 hover:underline">
                    open folder
                  </a>
                  )
                </>
              )}.
            </p>

            {/* Group selector */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Submitting as group:</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {loading ? 'Processing...' : <span className="flex items-center justify-center gap-2"><CheckCircleIcon className="w-4 h-4" /> Yes, I have submitted</span>}
            </button>
          </>
        )}

        {/* Step 2: Final confirm */}
        {step === 2 && (
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-5">
              <p className="text-sm text-yellow-800 font-medium flex items-center gap-2"><ExclamationIcon className="w-4 h-4 flex-shrink-0" /> {message}</p>
              <p className="text-sm text-yellow-700 mt-1">
                This action is <strong>irreversible</strong>. Click below to finalise.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-60 transition"
              >
                {loading ? 'Confirming...' : <span className="flex items-center justify-center gap-2"><CheckCircleIcon className="w-4 h-4" /> Confirm Final Submission</span>}
              </button>
              <button
                onClick={onClose}
                className="px-5 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConfirmModal;
