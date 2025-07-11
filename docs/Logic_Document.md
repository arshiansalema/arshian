# Logic Document - TodoBoard Real-time Collaborative Application

## Smart Assign Logic Implementation

### Overview
The Smart Assign feature automatically assigns tasks to the user with the fewest current active tasks. This ensures balanced workload distribution across all team members.

### Algorithm Details

#### 1. User Selection Process
- **Step 1**: Query all active users in the system (users with `isActive: true`)
- **Step 2**: For each user, count their active tasks (tasks with status `todo` or `in-progress`)
- **Step 3**: Identify the user(s) with the minimum active task count
- **Step 4**: If multiple users have the same minimum count, randomly select one

#### 2. Implementation Logic
```javascript
// Pseudocode representation
function smartAssign() {
  activeUsers = getAllActiveUsers()
  userTaskCounts = []
  
  for each user in activeUsers:
    activeTaskCount = countTasks(user, status=['todo', 'in-progress'])
    userTaskCounts.push({user, count: activeTaskCount})
  
  minCount = findMinimum(userTaskCounts.map(utc => utc.count))
  usersWithMinTasks = filter(userTaskCounts, utc => utc.count === minCount)
  
  selectedUser = randomSelect(usersWithMinTasks)
  return selectedUser
}
```

#### 3. Edge Cases Handled
- **No Active Users**: Returns error message if no active users found
- **Equal Distribution**: Uses random selection when multiple users have same task count
- **New User**: Automatically prioritizes users with zero active tasks
- **Archived Tasks**: Excludes archived tasks from the count calculation

#### 4. Real-time Updates
- Smart assign decisions are logged as activities
- All connected users receive real-time notifications
- Task assignment updates are immediately reflected in the UI

---

## Conflict Handling Logic Implementation

### Overview
The conflict handling system detects when multiple users attempt to edit the same task simultaneously and provides resolution mechanisms to maintain data integrity.

### Detection Mechanism

#### 1. Version-Based Conflict Detection
- Each task maintains a `version` number that increments on every update
- Client stores the task version when starting an edit session
- Server compares client version with current server version on update attempts

#### 2. Detection Algorithm
```javascript
// Pseudocode representation
function detectConflict(taskId, clientVersion) {
  serverTask = getTaskFromDatabase(taskId)
  
  if (clientVersion < serverTask.version) {
    return {
      conflict: true,
      clientVersion: clientVersion,
      serverVersion: serverTask.version,
      serverTask: serverTask
    }
  }
  
  return { conflict: false }
}
```

### Resolution Strategies

#### 1. Three Resolution Options
**Merge**: Intelligently combines changes from both versions
- Compares field-by-field differences
- Preserves non-conflicting changes from both versions
- Uses timestamp-based priority for conflicting fields

**Overwrite**: User chooses to use their version
- Discards server changes completely
- Applies client version as the new state
- Increments version number

**Cancel**: User chooses to keep server version
- Discards client changes
- Refreshes client with server state
- No version increment needed

#### 2. Resolution Implementation
```javascript
// Pseudocode representation
function resolveConflict(resolution, clientData, serverData) {
  switch(resolution) {
    case 'merge':
      resolved = mergeChanges(clientData, serverData)
      break
    case 'overwrite':
      resolved = clientData
      break
    case 'cancel':
      resolved = serverData
      break
  }
  
  updateTask(resolved)
  logResolution(resolution)
  notifyAllUsers(taskId, resolution)
}
```

### Real-time Conflict Management

#### 1. Edit Session Tracking
- Users join editing rooms via Socket.IO when opening tasks
- Server tracks who is currently editing each task
- Visual indicators show when others are editing

#### 2. Proactive Conflict Prevention
- Real-time typing indicators warn users of simultaneous editing
- Edit session notifications alert users when conflicts might occur
- Automatic session cleanup when users disconnect

#### 3. Conflict Resolution UI
- Modal dialog presents both versions side-by-side
- Highlights differences between conflicting versions
- Provides clear action buttons for resolution choice
- Shows user information for both editors

### Technical Implementation Details

#### 1. Database Considerations
- Optimistic locking using version numbers
- Transaction isolation for update operations
- Conflict logging for audit trails

#### 2. Network Handling
- WebSocket events for real-time notifications
- Retry mechanisms for failed updates
- Offline conflict queue for network interruptions

#### 3. User Experience
- Non-blocking conflict resolution
- Clear visual feedback during conflicts
- Preserve user work during resolution process

### Benefits of This Approach

1. **Data Integrity**: Prevents lost updates and data corruption
2. **User Awareness**: Real-time indicators prevent conflicts proactively
3. **Flexibility**: Multiple resolution strategies accommodate different scenarios
4. **Transparency**: Complete audit trail of all conflict resolutions
5. **Performance**: Minimal overhead with efficient version checking

---

## Technical Architecture Notes

### Smart Assign Benefits
- **Load Balancing**: Ensures fair distribution of work
- **Automation**: Reduces manual assignment overhead
- **Scalability**: Works efficiently with any number of users
- **Transparency**: All assignments are logged and visible

### Conflict Handling Benefits
- **Data Safety**: Prevents data loss in collaborative environments
- **User Control**: Empowers users to resolve conflicts meaningfully
- **Real-time Awareness**: Immediate feedback prevents most conflicts
- **Audit Trail**: Complete history of all conflict resolutions

Both features are designed to enhance collaboration while maintaining system reliability and user productivity.