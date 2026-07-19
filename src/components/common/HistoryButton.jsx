import { useState, useRef, useEffect } from 'react';
import { History, ChevronLeft, ChevronRight, X, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { getEntityHistory, getAllEntityHistory } from '../../services/auditService';

const HistoryButton = ({ entityType, entityId, onRevert, isAdmin = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [showAllModal, setShowAllModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const limit = 5;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadHistory = async (pageNum = 1) => {
    if (!entityId) return;
    setLoading(true);
    try {
      const offset = (pageNum - 1) * limit;
      const result = await getEntityHistory(entityType, entityId, limit, offset);
      setHistory(result.entries);
      setTotalPages(Math.ceil(result.total / limit));
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllHistory = async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const entries = await getAllEntityHistory(entityType, entityId);
      setAllHistory(entries);
    } catch (error) {
      console.error('Failed to load all history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (history.length === 0) {
      loadHistory(1);
    }
  };

  const handleViewAll = async () => {
    setShowAllModal(true);
    if (allHistory.length === 0) {
      await loadAllHistory();
    }
  };

  const handleRevertClick = (entry) => {
    setSelectedEntry(entry);
    setShowRevertModal(true);
  };

  const getChangedFields = (changes) => {
    if (!changes || Object.keys(changes).length === 0) return 'No changes';
    return Object.keys(changes).join(', ');
  };

  const formatAction = (entry) => {
    if (entry.action === 'create') return 'Created profile';
    if (entry.action === 'revert') return 'Reverted changes';
    if (entry.action === 'delete') return 'Deleted profile';
    return 'Updated';
  };

  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return format(date, 'MMMM d, yyyy');
    } catch {
      return timestamp;
    }
  };

  const renderRevertModal = () => {
    if (!showRevertModal || !selectedEntry) return null;

    const changes = selectedEntry.changes || {};
    const hasChanges = Object.keys(changes).length > 0;

    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div 
          className="p-6 max-w-md w-full mx-4 rounded-xl"
          style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">⚠️ Revert Changes?</h3>
            <button
              onClick={() => setShowRevertModal(false)}
              className="text-white/40 hover:text-white/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-sm text-white/60 mb-4">
            This will revert to the version from:{' '} 
            <span className="text-sm text-white/80 font-medium mb-4">
              {formatDate(selectedEntry.timestamp)}
            </span>
          </p>
          
          
          {hasChanges ? (
            <div className="bg-white/5 rounded-lg p-3 mb-4">
              <p className="text-xs text-white/40 mb-2">The following changes will be applied:</p>
              {Object.keys(changes).map(field => (
                <div key={field} className="flex items-center gap-2 text-sm py-1">
                  <span className="text-white/60">{field}:</span>
                  <span className="text-red-400 line-through">{String(changes[field].old)}</span>
                  <span className="text-white/40">→</span>
                  <span className="text-green-400">{String(changes[field].new)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/40 mb-4">No changes to revert.</p>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowRevertModal(false)}
              className="flex-1 px-4 py-2 rounded-lg text-sm text-white/60 hover:bg-white/10 transition-colors"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onRevert(selectedEntry);
                setShowRevertModal(false);
                setSelectedEntry(null);
                setIsOpen(false);
              }}
              disabled={!hasChanges}
              className="flex-1 px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Revert
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderViewAllModal = () => {
    if (!showAllModal) return null;
  
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div 
          className="w-full max-w-2xl max-h-[80vh] mx-4 flex flex-col rounded-xl"
          style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Complete History</h3>
            <button
              onClick={() => setShowAllModal(false)}
              className="text-white/40 hover:text-white/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {allHistory.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-8">No history available</p>
            ) : (
              <div className="space-y-2">
                {allHistory.map((entry, index) => {
                  const changes = entry.changes || {};
                  const hasChanges = Object.keys(changes).length > 0;
                  const fields = getChangedFields(changes);
                  return (
                    <div 
                      key={entry.id || index} 
                      className="rounded-lg p-3"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-white/40 min-w-[100px]">
                              {formatDate(entry.timestamp)}
                            </span>
                            <span className="text-xs text-white/60 truncate max-w-[150px]">
                              {fields}
                            </span>
                          </div>
                        </div>
                        {isAdmin && entry.action !== 'revert' && (
                          <button
                            onClick={() => {
                              setShowAllModal(false);
                              handleRevertClick(entry);
                            }}
                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Revert
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="relative inline-block">
        <button
          ref={buttonRef}
          onClick={handleOpen}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          title="View history"
        >
          <History className="w-5 h-5 text-white/60" />
        </button>

        {isOpen && (
            <div 
                ref={dropdownRef}
                className="absolute right-0 mt-2 max-h-[400px] dropdown-glass z-50 p-2 overflow-y-auto"
                style={{ width: '320px' }}
            >
            {/* Header with View All */}
            <div className="px-3 py-1.5 sticky top-0 bg-[#1a1a1a] z-10">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium pb-1 text-white/80">Change History</p>
                {history.length > 0 && (
                  <button
                    onClick={handleViewAll}
                    className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    View All
                    <span className="text-[10px] text-white/30">({history.length})</span>
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-white/10 mt-1" style={{opacity: 0.25}} />
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-pulse text-white/40 text-sm">Loading...</div>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-white/40">No history available</p>
              </div>
            ) : (
              <div className="space-y-0.5 mt-1">
                {history.map((entry, index) => {
                  const changes = entry.changes || {};
                  const hasChanges = Object.keys(changes).length > 0;
                  const fields = getChangedFields(changes);
                  const isRevert = entry.action === 'revert';
                  
                  return (
                    <div 
                      key={entry.id || index} 
                      className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <span className="text-xs text-white/40 min-w-[95px] flex-shrink-0">
                        {formatDate(entry.timestamp)}
                      </span>
                      <span className="text-xs text-white/60 flex-1 min-w-0 truncate max-w-[120px]">
                        {isRevert ? 'Reverted changes' : (fields || 'No changes')}
                      </span>
                      {isAdmin && !isRevert && hasChanges && (
                        <button
                          onClick={() => handleRevertClick(entry)}
                          className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex-shrink-0 ml-auto"
                        >
                          Revert
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination at bottom */}
            {totalPages > 1 && (
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-end gap-1" style={{ borderTopColor: 'rgba(255, 255, 255, 0.06)' }}>
                <button
                  onClick={() => loadHistory(page - 1)}
                  disabled={page <= 1}
                  className="p-1 text-white/40 hover:text-white/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => loadHistory(i + 1)}
                    className={`px-2 py-0.5 rounded text-xs transition-colors ${
                      page === i + 1
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => loadHistory(page + 1)}
                  disabled={page >= totalPages}
                  className="p-1 text-white/40 hover:text-white/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {renderRevertModal()}
      {renderViewAllModal()}
    </>
  );
};

export default HistoryButton;