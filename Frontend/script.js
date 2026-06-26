
let currentFilter = 'all';
let currentPriority = null;
let currentCategory = null;
let searchQuery = '';
let allTasks = [];


const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const taskTitleInput = document.getElementById('taskTitleInput');
const taskDescription = document.getElementById('taskDescription');
const taskPriority = document.getElementById('taskPriority');
const taskCategory = document.getElementById('taskCategory');
const taskDueDate = document.getElementById('taskDueDate');
const addTaskForm = document.getElementById('addTaskForm');
const loadingState = document.getElementById('loadingState');
const resultCount = document.getElementById('resultCount');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');
const currentDate = document.getElementById('currentDate');


const statTotal = document.getElementById('statTotal');
const statActive = document.getElementById('statActive');
const statCompleted = document.getElementById('statCompleted');
const statProgress = document.getElementById('statProgress');


const totalCount = document.getElementById('totalCount');
const activeCount = document.getElementById('activeCount');
const completedCount = document.getElementById('completedCount');


function showToast(message, type) {
   
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
   
    const colors = {
        success: {
            bg: '#4ade80',
            icon: '✅',
            shadow: 'rgba(74, 222, 128, 0.4)'
        },
        error: {
            bg: '#ff6b6b',
            icon: '❌',
            shadow: 'rgba(255, 107, 107, 0.4)'
        },
        warning: {
            bg: '#ffd93d',
            icon: '⚠️',
            shadow: 'rgba(255, 217, 61, 0.4)'
        },
        info: {
            bg: '#6c63ff',
            icon: '📌',
            shadow: 'rgba(108, 99, 255, 0.4)'
        }
    };
    
    const color = colors[type] || colors.success;
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
        position: fixed;
        top: 30px;
        right: 30px;
        background: ${color.bg};
        color: #0a0e1a;
        padding: 14px 24px;
        border-radius: 14px;
        font-size: 15px;
        font-weight: 600;
        z-index: 99999;
        box-shadow: 0 8px 30px ${color.shadow};
        max-width: 400px;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: toastSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateX(100%);
        opacity: 0;
    `;
    
    
    const iconSpan = document.createElement('span');
    iconSpan.style.fontSize = '22px';
    iconSpan.textContent = color.icon;
    toast.appendChild(iconSpan);
    
   
    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    toast.appendChild(msgSpan);
    
    document.body.appendChild(toast);
    
 
    setTimeout(function() {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    }, 50);
    
 
    setTimeout(function() {
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        toast.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(function() {
            toast.remove();
        }, 400);
    }, 3000);
}


function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if (currentDate) {
        currentDate.textContent = now.toLocaleDateString('en-US', options);
    }
}
setCurrentDate();


async function fetchTasks() {
    showLoading(true);
    try {
        let url = '/api/tasks?';
        const params = new URLSearchParams();

        if (searchQuery) params.append('search', searchQuery);
        if (currentFilter === 'active') params.append('status', 'active');
        else if (currentFilter === 'completed') params.append('status', 'completed');
        if (currentPriority) params.append('priority', currentPriority);
        if (currentCategory) params.append('category', currentCategory);

        url += params.toString();

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch tasks');

        const data = await response.json();
        
        allTasks = data.tasks;
        updateStats(data.stats);
        renderTasks(allTasks);
        updateBadges(data.stats);
        updateResultCount(allTasks.length, data.stats.total);
        updateMobileBadges(data.stats);

        return data;
    } catch (error) {
        console.error('❌ Error fetching tasks:', error);
        return null;
    } finally {
        showLoading(false);
    }
}

async function createTask(taskData) {
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create task');
        }

        showToast('Task created successfully! 🎉', 'success');
        await fetchTasks();
        return data;
    } catch (error) {
        console.error('❌ Error creating task:', error);
        showToast(error.message, 'error');
        return null;
    }
}

async function updateTask(id, updates) {
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update task');

       
        if (updates.completed === true) {
            showToast('🎯 Task completed! Great job! 🎉', 'success');
        } else if (updates.completed === false) {
            showToast('🔄 Task reopened', 'info');
        }

        await fetchTasks();
        return data;
    } catch (error) {
        console.error('❌ Error updating task:', error);
        showToast(error.message, 'error');
        return null;
    }
}

async function deleteTask(id) {
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok && response.status !== 204) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete task');
        }

        showToast('🗑️ Task deleted successfully', 'warning');
        await fetchTasks();
        return true;
    } catch (error) {
        console.error('❌ Error deleting task:', error);
        showToast(error.message, 'error');
        return false;
    }
}

async function clearCompletedTasks() {
    if (!confirm('Delete all completed tasks?')) return;

    try {
        const response = await fetch('/api/tasks', {
            method: 'DELETE'
        });
        
        if (!response.ok && response.status !== 204) {
            throw new Error('Failed to clear tasks');
        }
        showToast('🧹 All completed tasks cleared!', 'info');
        await fetchTasks();
    } catch (error) {
        console.error('❌ Error clearing tasks:', error);
        showToast(error.message, 'error');
    }
}


function renderTasks(tasks) {
    if (!tasks || tasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No tasks found</h3>
                <p>${searchQuery ? 'Try adjusting your search' : 'Create your first task above!'}</p>
            </div>
        `;
        return;
    }

    taskList.innerHTML = tasks.map(function(task) {
        return createTaskHTML(task);
    }).join('');
}

function createTaskHTML(task) {
    const priorityClass = 'priority-' + task.priority;
    const priorityIcon = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
    const categoryIcons = { academic: '📚', personal: '👤', work: '💼', general: '🏷️' };
    const categoryIcon = categoryIcons[task.category] || '🏷️';
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;


    const completedClass = task.completed ? 'completed' : '';

    return `
        <div class="task-item ${completedClass}" data-id="${task.id}">
            <div class="task-left">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} />
                <div class="task-content">
                    <span class="task-title">${escapeHTML(task.title)}</span>
                    ${task.description ? '<span class="task-description">' + escapeHTML(task.description) + '</span>' : ''}
                    <div class="task-meta">
                        <span class="task-tag ${priorityClass}">${priorityIcon} ${task.priority}</span>
                        <span class="task-tag category">${categoryIcon} ${task.category}</span>
                        ${task.dueDate ? `
                            <span class="task-tag due-date ${isOverdue ? 'priority-high' : ''}">
                                <i class="fas fa-calendar"></i> ${formatDate(task.dueDate)}
                                ${isOverdue ? ' ⚠️' : ''}
                            </span>
                        ` : ''}
                        ${task.completed ? '<span class="task-tag" style="background:rgba(74,222,128,0.15);color:#4ade80;">✅ Done</span>' : ''}
                    </div>
                </div>
            </div>
            <div class="edit-input-group">
                <input type="text" class="edit-input" value="${escapeHTML(task.title)}" />
                <button class="save-edit-btn">Save</button>
            </div>
            <div class="task-right">
                <button class="edit-btn" title="Edit"><i class="fas fa-pen"></i></button>
                <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


function updateStats(stats) {
    if (!stats) return;
    statTotal.textContent = stats.total;
    statActive.textContent = stats.active;
    statCompleted.textContent = stats.completed;
    const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    statProgress.textContent = progress + '%';
}

function updateBadges(stats) {
    if (!stats) return;
    totalCount.textContent = stats.total;
    activeCount.textContent = stats.active;
    completedCount.textContent = stats.completed;
}

function updateMobileBadges(stats) {
    if (!stats) return;
    const totalBadge = document.getElementById('mobileTotalBadge');
    const activeBadge = document.getElementById('mobileActiveBadge');
    const completedBadge = document.getElementById('mobileCompletedBadge');
    
    if (totalBadge) totalBadge.textContent = stats.total;
    if (activeBadge) activeBadge.textContent = stats.active;
    if (completedBadge) completedBadge.textContent = stats.completed;
}

function updateResultCount(filtered, total) {
    if (searchQuery || currentFilter !== 'all' || currentPriority || currentCategory) {
        resultCount.textContent = filtered + ' of ' + total + ' tasks';
    } else {
        resultCount.textContent = total + ' tasks';
    }
}

function showLoading(show) {
    if (loadingState) {
        loadingState.style.display = show ? 'block' : 'none';
    }
}

function updatePageTitle() {
    const titles = { 'all': 'All Tasks', 'active': 'Active Tasks', 'completed': 'Completed Tasks' };
    let title = titles[currentFilter] || 'All Tasks';
    let subtitle = 'Manage your academic journey';

    if (currentPriority) {
        title = currentPriority.charAt(0).toUpperCase() + currentPriority.slice(1) + ' Priority Tasks';
        subtitle = 'Filtered by priority';
    } else if (currentCategory) {
        title = currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1) + ' Tasks';
        subtitle = 'Filtered by category';
    } else if (searchQuery) {
        title = 'Search: "' + searchQuery + '"';
        subtitle = 'Showing results for your search';
    }

    pageTitle.textContent = title;
    pageSubtitle.textContent = subtitle;
}




if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        searchQuery = e.target.value.trim();
        if (clearSearchBtn) {
            clearSearchBtn.classList.toggle('show', searchQuery.length > 0);
        }
        updatePageTitle();
        fetchTasks();
    });
}

if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', function() {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.remove('show');
        updatePageTitle();
        fetchTasks();
        searchInput.focus();
    });
}


document.querySelectorAll('.nav-item[data-filter]').forEach(function(item) {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(function(n) {
            n.classList.remove('active');
        });
        item.classList.add('active');

        document.querySelectorAll('.nav-item[data-priority]').forEach(function(n) {
            n.classList.remove('active');
        });
        document.querySelectorAll('.nav-item[data-category]').forEach(function(n) {
            n.classList.remove('active');
        });

        currentFilter = item.dataset.filter;
        currentPriority = null;
        currentCategory = null;
        updatePageTitle();
        fetchTasks();

        
        document.querySelectorAll('.mobile-nav-item[data-filter]').forEach(function(n) {
            n.classList.remove('active');
        });
        var mobileItem = document.querySelector('.mobile-nav-item[data-filter="' + currentFilter + '"]');
        if (mobileItem) mobileItem.classList.add('active');
    });
});

document.querySelectorAll('.nav-item[data-priority]').forEach(function(item) {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(function(n) {
            n.classList.remove('active');
        });
        item.classList.add('active');

        document.querySelectorAll('.nav-item[data-filter]').forEach(function(n) {
            n.classList.remove('active');
        });
        document.querySelectorAll('.nav-item[data-category]').forEach(function(n) {
            n.classList.remove('active');
        });

        currentPriority = item.dataset.priority;
        currentFilter = 'all';
        currentCategory = null;
        updatePageTitle();
        fetchTasks();
    });
});

document.querySelectorAll('.nav-item[data-category]').forEach(function(item) {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(function(n) {
            n.classList.remove('active');
        });
        item.classList.add('active');

        document.querySelectorAll('.nav-item[data-filter]').forEach(function(n) {
            n.classList.remove('active');
        });
        document.querySelectorAll('.nav-item[data-priority]').forEach(function(n) {
            n.classList.remove('active');
        });

        currentCategory = item.dataset.category;
        currentFilter = 'all';
        currentPriority = null;
        updatePageTitle();
        fetchTasks();
    });
});


if (addTaskForm) {
    addTaskForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const title = taskTitleInput.value.trim();
        
        if (!title) {
            showToast('Please enter a task title', 'warning');
            taskTitleInput.focus();
            return;
        }

        const submitBtn = addTaskForm.querySelector('.btn-add-task');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

        const taskData = {
            title: title,
            description: taskDescription.value.trim(),
            priority: taskPriority.value,
            category: taskCategory.value,
            dueDate: taskDueDate.value || ''
        };

        const result = await createTask(taskData);
        
        if (result) {
            taskTitleInput.value = '';
            taskDescription.value = '';
            taskDueDate.value = '';
            taskTitleInput.focus();
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Task';
    });
}


if (taskList) {
    taskList.addEventListener('click', async function(e) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;
        const taskId = parseInt(taskItem.dataset.id);

       
        if (e.target.classList.contains('task-checkbox')) {
            const isChecked = e.target.checked;
            const taskTitle = taskItem.querySelector('.task-title')?.textContent || 'Task';
            
            console.log('✅ Toggling task:', taskId, 'to:', isChecked);
            
            // Add animation to checkbox
            e.target.style.transition = 'all 0.3s ease';
            e.target.style.transform = 'scale(1.3)';
            setTimeout(function() {
                e.target.style.transform = 'scale(1)';
            }, 300);
            
            await updateTask(taskId, { completed: isChecked });
            
            // If completed, add celebration effect
            if (isChecked) {
                // Add a quick celebration animation
                taskItem.style.transition = 'all 0.5s ease';
                taskItem.style.borderColor = '#4ade80';
                taskItem.style.boxShadow = '0 0 30px rgba(74, 222, 128, 0.2)';
                setTimeout(function() {
                    taskItem.style.borderColor = '';
                    taskItem.style.boxShadow = '';
                }, 1500);
            }
            return;
        }

        
        if (e.target.closest('.delete-btn')) {
            if (confirm('Delete this task?')) {
                await deleteTask(taskId);
            }
            return;
        }

        
        if (e.target.closest('.edit-btn')) {
            document.querySelectorAll('.task-item.editing').forEach(function(el) {
                if (el !== taskItem) el.classList.remove('editing');
            });
            taskItem.classList.add('editing');
            var input = taskItem.querySelector('.edit-input');
            input.focus();
            input.select();
            return;
        }

       
        if (e.target.closest('.save-edit-btn')) {
            var input = taskItem.querySelector('.edit-input');
            var newTitle = input.value.trim();

            if (!newTitle) {
                showToast('Task title cannot be empty', 'warning');
                return;
            }

            await updateTask(taskId, { title: newTitle });
            taskItem.classList.remove('editing');
            showToast('✏️ Task updated successfully!', 'info');
            return;
        }
    });
}


if (taskList) {
    taskList.addEventListener('keydown', function(e) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;

        if (e.target.classList.contains('edit-input')) {
            if (e.key === 'Enter') {
                var saveBtn = taskItem.querySelector('.save-edit-btn');
                if (saveBtn) saveBtn.click();
            }
            if (e.key === 'Escape') {
                taskItem.classList.remove('editing');
            }
        }
    });
}


var clearBtn = document.getElementById('clearCompletedBtn');
if (clearBtn) {
    clearBtn.addEventListener('click', clearCompletedTasks);
}

function toggleSidebar() {
    var sidebar = document.querySelector('.sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}

function closeSidebar() {
    var sidebar = document.querySelector('.sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

var mobileMenuBtn = document.getElementById('mobileMenuBtn');
var mobileMenuToggle = document.getElementById('mobileMenuToggle');
var sidebarOverlay = document.getElementById('sidebarOverlay');

if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleSidebar);
if (mobileMenuToggle) mobileMenuToggle.addEventListener('click', toggleSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

var mobileFabBtn = document.getElementById('mobileFabBtn');
var mobileAddBtn = document.getElementById('mobileAddBtn');

if (mobileFabBtn) {
    mobileFabBtn.addEventListener('click', function() {
        var addSection = document.querySelector('.add-task-section');
        if (addSection) {
            addSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(function() {
                document.getElementById('taskTitleInput').focus();
            }, 500);
        }
    });
}

if (mobileAddBtn) {
    mobileAddBtn.addEventListener('click', function() {
        var addSection = document.querySelector('.add-task-section');
        if (addSection) {
            addSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(function() {
                document.getElementById('taskTitleInput').focus();
            }, 500);
        }
    });
}

// Mobile nav filters
document.querySelectorAll('.mobile-nav-item[data-filter]').forEach(function(item) {
    item.addEventListener('click', function() {
        document.querySelectorAll('.mobile-nav-item[data-filter]').forEach(function(n) {
            n.classList.remove('active');
        });
        item.classList.add('active');

        var filter = item.dataset.filter;
        var desktopItem = document.querySelector('.nav-item[data-filter="' + filter + '"]');
        if (desktopItem) desktopItem.click();
        closeSidebar();
    });
});


document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInput) searchInput.focus();
    }
    if (e.key === 'Escape') {
        closeSidebar();
        if (document.activeElement === searchInput) {
            if (clearSearchBtn) clearSearchBtn.click();
        }
    }
});


document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 StudentHub Dashboard loading...');
    fetchTasks();
    if (taskTitleInput) taskTitleInput.focus();

    var defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    if (taskDueDate) {
        taskDueDate.value = defaultDate.toISOString().split('T')[0];
    }
    
    console.log('✅ Dashboard ready!');
});

document.addEventListener('visibilitychange', function() {
    if (!document.hidden) fetchTasks();
});

console.log('📚 StudentHub Dashboard loaded!');


var style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideIn {
        0% {
            transform: translateX(100%);
            opacity: 0;
        }
        100% {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .toast-notification {
        font-family: 'Inter', sans-serif;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
    }
`;
document.head.appendChild(style);