import { useState, useMemo } from 'react';

/**
 * Custom hook to filter and search tasks client-side.
 * Supports filtering by status, priority, and assigned user.
 * 
 * @param {Array} initialTasks - Array of task objects from API
 */
export default function useTaskFilters(initialTasks = []) {
  const [filters, setFilters] = useState({
    status: '',       // 'TODO', 'IN_PROGRESS', 'COMPLETED'
    priority: '',     // 'LOW', 'MEDIUM', 'HIGH'
    assignedTo: '',   // User ID
    search: '',       // Title or description text
  });

  // Perform filtering using useMemo for performance optimization
  const filteredTasks = useMemo(() => {
    if (!Array.isArray(initialTasks)) return [];

    return initialTasks.filter((task) => {
      // 1. Filter by Status (normalize check in case of status naming discrepancies)
      if (filters.status) {
        const tStatus = task.status?.toUpperCase().replace('_', '');
        const fStatus = filters.status?.toUpperCase().replace('_', '');
        if (tStatus !== fStatus) return false;
      }

      // 2. Filter by Priority
      if (filters.priority) {
        if (task.priority?.toUpperCase() !== filters.priority.toUpperCase()) {
          return false;
        }
      }

      // 3. Filter by Assigned User ID (check the array of task.assignments)
      if (filters.assignedTo) {
        const isAssigned = task.assignments?.some((assignment) => {
          // Supports both object checks and nested checks
          const userId = assignment.userId || assignment.user?.id;
          return userId === filters.assignedTo;
        });
        if (!isAssigned) return false;
      }

      // 4. Client-side Search by Title
      if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        const matchesTitle = task.title?.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [initialTasks, filters]);

  // Handler to update specific filter keys
  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Helper to reset all filters to default state
  const resetFilters = () => {
    setFilters({
      status: '',
      priority: '',
      assignedTo: '',
      search: '',
    });
  };

  return {
    filters,
    filteredTasks,
    updateFilter,
    resetFilters,
  };
}
