# 6. Runtime View

## Scenario 1 — Application Startup

When the user launches the application, the main process creates the window and the renderer process loads persisted data before rendering the calendar.

```mermaid
sequenceDiagram
    participant OS as Operating System
    participant Main as Main Process\n(AppWindow + PersistenceHandler)
    participant Preload as Preload Script\n(contextBridge)
    participant Renderer as Renderer Process\n(React App)
    participant FS as File System\n(presence-data.json)

    OS->>Main: launch Electron
    Main->>Main: create BrowserWindow (with preload)
    Main->>Preload: inject contextBridge API
    Main->>Renderer: load index.html
    Renderer->>Renderer: React mount — App.useEffect
    Renderer->>Preload: window.presenceAPI.loadData()
    Preload->>Main: IPC invoke('load-data')
    Main->>FS: fs.readFile(userData/presence-data.json)
    FS-->>Main: JSON string (or ENOENT)
    Main-->>Preload: parsed data object (or {})
    Preload-->>Renderer: data object
    Renderer->>Renderer: setState(dayStatuses)
    Renderer->>Renderer: compute holidays for current year
    Renderer->>Renderer: compute MonthStats for current month
    Renderer->>Renderer: render CalendarView + MonthlyOverviewPanel
```

## Scenario 2 — Day Status Change

When the user clicks a day cell, the raw click event (date only) is emitted to `App`. `App` computes the new status via `StatusCycler`, updates state, and persists asynchronously.

```mermaid
sequenceDiagram
    participant User as User
    participant DayCell as DayCell\n(React component)
    participant App as App\n(root state)
    participant Cycler as StatusCycler
    participant Calc as WorkingTimeCalculator
    participant Client as PersistenceClient
    participant Main as Main Process\n(PersistenceHandler)
    participant FS as File System

    User->>DayCell: click on a working day
    DayCell->>App: onStatusChange(date)
    App->>Cycler: nextStatus(currentStatus)
    Cycler-->>App: newStatus
    App->>App: update dayStatuses in state\n(remove key if newStatus === 'home-office')
    App->>Calc: calculateMonthStats(year, month, dayStatuses, holidays)
    Calc-->>App: MonthStats
    App->>App: setState — triggers re-render
    App-->>DayCell: new status prop (cell updates colour)
    App-->>MonthlyOverviewPanel: new MonthStats (overview updates)
    App->>Client: saveData(dayStatuses)
    Client->>Main: IPC invoke('save-data', dayStatuses)
    Main->>FS: fs.writeFile(presence-data.json, JSON.stringify(data))
    FS-->>Main: write complete
    Main-->>Client: void (no UI feedback needed)
```

Note: the save is fire-and-forget from the UI's perspective — the visual update happens before the file write completes.

## Scenario 3 — Month Navigation

When the user clicks the forward or backward navigation control, the displayed month changes and all derived data recomputes.

```mermaid
sequenceDiagram
    participant User as User
    participant Nav as MonthNavigator
    participant App as App\n(root state)
    participant Holiday as HolidayService
    participant Calc as WorkingTimeCalculator

    User->>Nav: click next/prev month button
    Nav->>App: onNextMonth() or onPrevMonth()
    App->>App: update currentMonth state\n(year/month adjusted, wraps Jan↔Dec)
    App->>Holiday: getBavarianHolidays(newYear)\n(via useMemo keyed on year; recomputed only when year changes)
    Holiday-->>App: Set<string> of holiday dates
    App->>Calc: calculateMonthStats(newYear, newMonth, dayStatuses, holidays)
    Calc-->>App: MonthStats
    App->>App: setState — triggers re-render
    App-->>CalendarView: new month grid (with holiday flags)
    App-->>MonthlyOverviewPanel: new MonthStats
```

No persistence occurs during month navigation — the user is only changing the view; the underlying data is unchanged.

## Scenario 4 — Corrupted or Unparseable JSON File

When the persisted JSON file exists but cannot be parsed (e.g., truncated due to a crash during a previous write), the application recovers gracefully and starts with a clean state.

```mermaid
sequenceDiagram
    participant Main as Main Process\n(PersistenceHandler)
    participant FS as File System\n(presence-data.json)
    participant Preload as Preload Script\n(contextBridge)
    participant Renderer as Renderer Process\n(React App)

    Main->>FS: fs.readFile(userData/presence-data.json)
    FS-->>Main: invalid / unparseable JSON string
    Main->>Main: JSON.parse throws — PersistenceHandler catches error
    Main->>Main: log error to main process console
    Main-->>Preload: {} (empty object)
    Preload-->>Renderer: {}
    Renderer->>Renderer: setState(dayStatuses = {})
    Renderer->>Renderer: render CalendarView with all days defaulting to home-office
```

The application starts with all days defaulting to home-office, as if no data had ever been saved.
