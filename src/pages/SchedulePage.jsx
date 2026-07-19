import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowUpDown } from 'lucide-react';
import useTuteeStore from '../stores/tuteeStore';
import useTutorStore from '../stores/tutorStore';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
import ColumnHeader from '../components/lists/ColumnHeader';

const SchedulePage = () => {
  const navigate = useNavigate();
  const { tutees, isLoading: tuteesLoading, fetchTutees } = useTuteeStore();
  const { tutors, isLoading: tutorsLoading, fetchTutors } = useTutorStore();
  
  const [schoolYearFilter, setSchoolYearFilter] = useState('all');
  const [tutorFilter, setTutorFilter] = useState('all');
  const [weekdayFilter, setWeekdayFilter] = useState('all');
  const [hoveredTutorId, setHoveredTutorId] = useState(null);
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [tutorSortDirection, setTutorSortDirection] = useState('asc');

  // Get unique school years from tutees
  const schoolYears = useMemo(() => {
    const years = new Set();
    tutees.forEach(t => {
      if (t.enrollmentDate) {
        const year = new Date(t.enrollmentDate).getFullYear();
        years.add(year);
      }
    });
    return Array.from(years).sort();
  }, [tutees]);

  // Set default to most recent year
  const defaultYear = useMemo(() => {
    if (schoolYears.length > 0) {
      return schoolYears[schoolYears.length - 1].toString();
    }
    return 'all';
  }, [schoolYears]);

  useEffect(() => {
    fetchTutees();
    fetchTutors();
  }, []);

  // Update default year when data loads
  useEffect(() => {
    if (schoolYears.length > 0) {
      const mostRecent = schoolYears[schoolYears.length - 1].toString();
      setSchoolYearFilter(mostRecent);
    }
  }, [schoolYears]);

  // Build schedule data: group tutees by tutor
  const scheduleData = useMemo(() => {
    const grouped = {};
    
    tutees.forEach(tutee => {
      if (!tutee.tutorId) return;
      
      const tutor = tutors.find(t => t.id === tutee.tutorId);
      if (!tutor) return;
      
      if (!grouped[tutee.tutorId]) {
        grouped[tutee.tutorId] = {
          tutor: tutor,
          tutees: []
        };
      }
      grouped[tutee.tutorId].tutees.push(tutee);
    });

    // Sort tutees within each group by earliest start time
    Object.keys(grouped).forEach(key => {
      grouped[key].tutees.sort((a, b) => {
        const scheduleA = a.schedule || {};
        const scheduleB = b.schedule || {};
        
        const getEarliestTime = (schedule) => {
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          let earliest = null;
          
          for (const day of days) {
            const value = schedule[day];
            if (!value) continue;
            
            let timeStr = '';
            if (typeof value === 'object' && value !== null && value.start) {
              timeStr = value.start;
            } else if (typeof value === 'string') {
              timeStr = value;
            }
            
            if (timeStr && timeStr !== 'TBA') {
              try {
                const time = new Date(`1970-01-01 ${timeStr}`);
                if (!earliest || time < earliest) {
                  earliest = time;
                }
              } catch (e) {
                // Skip invalid times
              }
            }
          }
          return earliest;
        };
        
        const timeA = getEarliestTime(scheduleA);
        const timeB = getEarliestTime(scheduleB);
        
        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;
        return timeA - timeB;
      });
    });

    // Sort tutors by name based on sort direction
    const sortedGroups = Object.values(grouped).sort((a, b) => {
      const nameA = `${a.tutor.firstName} ${a.tutor.lastName}`;
      const nameB = `${b.tutor.firstName} ${b.tutor.lastName}`;
      return tutorSortDirection === 'asc' 
        ? nameA.localeCompare(nameB) 
        : nameB.localeCompare(nameA);
    });
    
    return sortedGroups;
  }, [tutees, tutors, tutorSortDirection]);

  // Toggle tutor sort
  const toggleTutorSort = () => {
    setTutorSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Filter schedule data
  const filteredSchedule = useMemo(() => {
    let result = [...scheduleData];

    if (tutorFilter !== 'all') {
      result = result.filter(group => group.tutor.id === tutorFilter);
    }

    if (schoolYearFilter !== 'all') {
      result = result.map(group => ({
        ...group,
        tutees: group.tutees.filter(t => {
          const year = new Date(t.enrollmentDate).getFullYear();
          return year === parseInt(schoolYearFilter);
        })
      })).filter(group => group.tutees.length > 0);
    }

    if (weekdayFilter !== 'all') {
      const dayMap = {
        'monday': 'Mon',
        'tuesday': 'Tue',
        'wednesday': 'Wed',
        'thursday': 'Thu',
        'friday': 'Fri',
        'saturday': 'Sat'
      };
      const day = dayMap[weekdayFilter];
      result = result.map(group => ({
        ...group,
        tutees: group.tutees.filter(t => {
          const schedule = t.schedule || {};
          const value = schedule[day];
          if (!value) return false;
          if (value === 'TBA') return false;
          if (typeof value === 'object' && value.start) return true;
          if (typeof value === 'string') return true;
          return false;
        })
      })).filter(group => group.tutees.length > 0);
    }

    return result;
  }, [scheduleData, tutorFilter, schoolYearFilter, weekdayFilter]);

  // Flatten for rowspan info and continuous numbering
  const flattenedData = useMemo(() => {
    const items = [];
    let tutorCounter = 0;
    
    filteredSchedule.forEach(group => {
      tutorCounter++;
      const tuteeCount = group.tutees.length;
      group.tutees.forEach((tutee, idx) => {
        items.push({
          ...group,
          tutee,
          isFirst: idx === 0,
          totalTutees: tuteeCount,
          tutorNumber: tutorCounter,
        });
      });
    });
    return items;
  }, [filteredSchedule]);

  // Build filter options with dynamic labels
  const getTutorOptions = () => {
    const counts = {};
    tutors.forEach(t => {
      const count = tutees.filter(tutee => tutee.tutorId === t.id).length;
      if (count > 0) {
        counts[t.id] = count;
      }
    });
    const options = [{ value: 'all', label: 'All Tutors', count: tutees.length }];
    tutors.forEach(t => {
      if (counts[t.id]) {
        options.push({
          value: t.id,
          label: `${t.firstName} ${t.lastName}`,
          count: counts[t.id]
        });
      }
    });
    return options;
  };

  const getSchoolYearOptions = () => {
    const options = [{ value: 'all', label: 'All Years', count: tutees.length }];
    schoolYears.forEach(year => {
      const count = tutees.filter(t => {
        if (t.enrollmentDate) {
          return new Date(t.enrollmentDate).getFullYear() === year;
        }
        return false;
      }).length;
      options.push({
        value: year.toString(),
        label: `SY ${year}-${year + 1}`,
        count
      });
    });
    return options;
  };

  const getWeekdayOptions = () => {
    const dayMap = {
      'monday': 'Mon',
      'tuesday': 'Tue',
      'wednesday': 'Wed',
      'thursday': 'Thu',
      'friday': 'Fri',
      'saturday': 'Sat'
    };
    const options = [{ value: 'all', label: 'All Weekdays', count: tutees.length }];
    Object.entries(dayMap).forEach(([key, day]) => {
      const count = tutees.filter(t => {
        const schedule = t.schedule || {};
        const value = schedule[day];
        if (!value) return false;
        if (value === 'TBA') return false;
        if (typeof value === 'object' && value.start) return true;
        if (typeof value === 'string') return true;
        return false;
      }).length;
      options.push({
        value: key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        count
      });
    });
    return options;
  };

  const getActiveSchoolYear = () => {
    if (schoolYearFilter === 'all') return '';
    const year = parseInt(schoolYearFilter);
    return `(SY ${year}-${year + 1})`;
  };

  const getSelectedLabel = (options, value) => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : 'Filter';
  };

  const renderScheduleCell = (tutee, day, isHovered) => {
    const schedule = tutee.schedule || {};
    const value = schedule[day] || 'TBA';
    
    if (typeof value === 'object' && value !== null && value.start) {
      return (
        <div className="flex flex-col leading-tight">
          <span className="text-[11px] text-white/70 font-medium">{value.start}</span>
          <span className="text-[11px] text-white/70 font-medium">{value.end || ''}</span>
        </div>
      );
    }
    
    const displayValue = typeof value === 'string' ? value : 'TBA';
    const isTBA = displayValue === 'TBA';
    return (
      <span style={{ 
        color: isTBA ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
        fontWeight: isTBA ? '400' : '500',
        fontSize: '11px',
      }}>
        {displayValue}
      </span>
    );
  };
  
  if (tuteesLoading || tutorsLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <div className="container mx-auto px-4 py-4 pb-32">
          <div className="glass-card p-6 animate-pulse">
            <div className="h-8 bg-white/10 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-white/10 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const tutorOptions = getTutorOptions();
  const schoolYearOptions = getSchoolYearOptions();
  const weekdayOptions = getWeekdayOptions();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      
      <div className="container mx-auto px-4 py-4 pb-32">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Tutors' Schedule {getActiveSchoolYear()}
          </h2>
          <button className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
            <Plus className="w-3 h-3" />
            Add Schedule
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-4 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Year:</span>
            <ColumnHeader
              label={getSelectedLabel(schoolYearOptions, schoolYearFilter)}
              type="filter"
              options={schoolYearOptions}
              value={schoolYearFilter}
              onChange={setSchoolYearFilter}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Tutor:</span>
            <ColumnHeader
              label={getSelectedLabel(tutorOptions, tutorFilter)}
              type="filter"
              options={tutorOptions}
              value={tutorFilter}
              onChange={setTutorFilter}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Day:</span>
            <ColumnHeader
              label={getSelectedLabel(weekdayOptions, weekdayFilter)}
              type="filter"
              options={weekdayOptions}
              value={weekdayFilter}
              onChange={setWeekdayFilter}
            />
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="border-0">
                  <th className="text-left py-3 px-3 text-xs font-medium text-white/40 w-12 border-0">#</th>
                  <th 
                    className="text-left py-3 px-3 text-xs font-medium border-0 cursor-pointer hover:text-white/70 transition-colors"
                    onClick={toggleTutorSort}
                    style={{
                      color: tutorSortDirection ? '#a78bfa' : 'rgba(255, 255, 255, 0.4)',
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Tutor Name</span>
                      <ArrowUpDown 
                        className="w-3 h-3"
                        style={{
                          color: tutorSortDirection ? '#a78bfa' : 'rgba(255, 255, 255, 0.3)',
                        }}
                      />
                    </div>
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-white/40 min-w-[120px] border-0">Tutee Name</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-white/40 min-w-[90px] border-0">Monday</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-white/40 min-w-[90px] border-0">Tuesday</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-white/40 min-w-[90px] border-0">Wednesday</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-white/40 min-w-[90px] border-0">Thursday</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-white/40 min-w-[90px] border-0">Friday</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-white/40 min-w-[90px] border-0">Saturday</th>
                </tr>
              </thead>
              <tbody>
                {flattenedData.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12 text-white/40 text-sm border-0">
                      No schedule found
                    </td>
                  </tr>
                ) : (
                  flattenedData.map((item, index) => {
                    const rowId = `${item.tutor.id}-${item.tutee.id}`;
                    const isTutorHovered = hoveredTutorId === item.tutor.id;
                    const isRowHovered = hoveredRowId === rowId;
                    const isHovered = isTutorHovered || isRowHovered;
                    
                    return (
                      <tr 
                        key={`${rowId}-${index}`}
                        className={`border-0 transition-colors cursor-pointer ${
                          isHovered ? 'bg-white/5' : ''
                        }`}
                        onMouseEnter={() => {
                          setHoveredRowId(rowId);
                        }}
                        onMouseLeave={() => {
                          setHoveredRowId(null);
                        }}
                        onClick={() => navigate(`/tutee/${item.tutee.id}`)}
                      >
                        {item.isFirst && (
                          <td 
                            className="py-3 px-3 text-sm text-white/40 align-middle border-0"
                            rowSpan={item.totalTutees}
                          >
                            {item.tutorNumber}
                          </td>
                        )}
                        
                        {item.isFirst && (
                          <td 
                            className={`py-3 px-3 text-sm font-medium align-middle border-0 transition-colors ${
                              isTutorHovered ? 'text-white/90' : 'text-white/80'
                            }`}
                            rowSpan={item.totalTutees}
                            onMouseEnter={() => setHoveredTutorId(item.tutor.id)}
                            onMouseLeave={() => setHoveredTutorId(null)}
                          >
                            {`${item.tutor.firstName} ${item.tutor.lastName}`}
                          </td>
                        )}
                        
                        <td className={`py-3 px-3 text-sm border-0 transition-colors ${
                          isRowHovered ? 'text-white/80' : 'text-white/60'
                        }`}>
                          {item.tutee.firstName} {item.tutee.lastName}
                        </td>
                        
                        <td className={`py-3 px-3 text-sm border-0 transition-colors ${
                          isRowHovered ? 'text-white/80' : 'text-white/60'
                        }`}>
                          {renderScheduleCell(item.tutee, 'Mon', isRowHovered)}
                        </td>
                        <td className={`py-3 px-3 text-sm border-0 transition-colors ${
                          isRowHovered ? 'text-white/80' : 'text-white/60'
                        }`}>
                          {renderScheduleCell(item.tutee, 'Tue', isRowHovered)}
                        </td>
                        <td className={`py-3 px-3 text-sm border-0 transition-colors ${
                          isRowHovered ? 'text-white/80' : 'text-white/60'
                        }`}>
                          {renderScheduleCell(item.tutee, 'Wed', isRowHovered)}
                        </td>
                        <td className={`py-3 px-3 text-sm border-0 transition-colors ${
                          isRowHovered ? 'text-white/80' : 'text-white/60'
                        }`}>
                          {renderScheduleCell(item.tutee, 'Thu', isRowHovered)}
                        </td>
                        <td className={`py-3 px-3 text-sm border-0 transition-colors ${
                          isRowHovered ? 'text-white/80' : 'text-white/60'
                        }`}>
                          {renderScheduleCell(item.tutee, 'Fri', isRowHovered)}
                        </td>
                        <td className={`py-3 px-3 text-sm border-0 transition-colors ${
                          isRowHovered ? 'text-white/80' : 'text-white/60'
                        }`}>
                          {renderScheduleCell(item.tutee, 'Sat', isRowHovered)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Result count */}
        <div className="mt-4 text-center">
          <p className="text-xs text-white/40">
            Showing {flattenedData.length} entries
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default SchedulePage;