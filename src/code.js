function getFormatedDateTime(date) {
  const dateFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  };

  return `${date.toLocaleDateString('en-US', dateFormatOptions)}, ${getFormatedTime(date)}`
};

function getFormatedTime(date) {
  const timeFormatOptions = {
    timeStyle: 'short',
  }
  return `${date.toLocaleTimeString('en-US', timeFormatOptions)}`
}

function createAppEventsSummary(dateRange, appEvents, calendarName) {
  return {
    range: dateRange,
    hours: function () {
      let total = 0;
      appEvents.forEach((event) => {
        total += event.hours;
      });
      return total;
    },
    appEvents: appEvents,
    print: function () {
      return `SUMMARY:
        Calendar name: ${calendarName}
        Start date: ${getFormatedDateTime(new Date(this.range.start))}
        End date: ${getFormatedDateTime(new Date(this.range.end))}
        Number of events: ${this.appEvents.length}
        Total hours: ${this.hours()}

        EVENTS: 
        ${this.appEvents.map((appEvent) => appEvent.print()).join("\n")}`;
    },
    getData: function () {
      const data = {
        calendarName: calendarName,
        start: this.range.start,
        end: this.range.end,
        numEvents: this.appEvents.length,
        totalHours: this.hours(),
      }
      console.log(`#createAppEventsSummary.getData()
        data=${JSON.stringify(data)}
        `);
      return {
        calendarName: calendarName,
        start: this.range.start,
        end: this.range.end,
        numEvents: this.appEvents.length,
        totalHours: this.hours(),
      }
    }
  };
}

function createAppEvent(event) {
  function getHours() {
    return getNumHoursInRange({start: event.getStartTime(), end: event.getEndTime()})
  }
  return {
    hours: getHours(),
    event: event,
    print: () => {
      return `Date: ${getFormatedDateTime(new Date(event.getStartTime()))}
        Title: ${event.getTitle()}        
        Start: ${getFormatedTime(new Date(event.getStartTime()))}
        End: ${getFormatedTime(new Date(event.getEndTime()))}
        Hours: ${getHours()}
      `
    },
    getData: () => {
      const data = {
        title: event.getTitle(),
        start: new Date(event.getStartTime()).toJSON(),
        end: new Date(event.getEndTime()).toJSON(),
        hours: getHours(),
      }
      return data;
    }
  }
}

function getCalendarEventsForRanges(calendar, dateRanges) {
  return dateRanges
    .map((dateRange) => {
      return calendar
        .getEvents(dateRange.start, dateRange.end)
          .filter((event) => {
            return !(event.getDescription().includes('not billable') || event.getDescription().includes('Not billable')) && !(event.getDescription().includes("don't track") || event.getDescription().includes("Don't track"))
          })
    }).flat();
}

function client_computeResults(calendarId, dateRange) {
  console.warn(`#client_computeResutls(calendarId=${calendarId}, dateRange=${JSON.stringify(dateRange)})`);
  const calendar = CalendarApp.getCalendarById(calendarId);
  if(!calendar) {
    throw new Error(`#Error in client_computeResults(calendarId=${calendarId}, dateRange=${JSON.stringify(dateRange)})
      Calendar not found error
    `);
  }
  console.log(`#client_computeResults(calendarId=${calendarId}, dateRange=${JSON.stringify(dateRange)})
  `)
  const interval = hoursToMs(24);
  const dateRanges = getRangesForInterval(dateRange, interval);
  const calendarEventsForRanges = getCalendarEventsForRanges(calendar, dateRanges);
  const appEvents = calendarEventsForRanges.map((calendarEvent) => createAppEvent(calendarEvent));
  const appEventsSummary = createAppEventsSummary(dateRange, appEvents, calendar.getName());
  let eventsData = [];
  appEvents.forEach((appEvent) => {
    eventsData.push(appEvent.getData());
  })
  const data = {
    summaryData: appEventsSummary.getData(),
    eventsData: eventsData,
  }
  console.log(`#client_computeResults
  data.length=${Object.keys(data).length}, appEvents.length=${appEvents.length})}
  `);
  return data;
}

function getRangesForInterval(dateRange, interval) {
  console.log(`getRangesForInterval(dateRange: ${JSON.stringify(dateRange)}, interval: ${interval})`)
  const ONE_SECOND = 1000;
  const ranges = [];
  let currentTime = dateRange.start;
  while(currentTime < dateRange.end) {
    ranges.push({
      start: new Date(currentTime),
      end: new Date(currentTime + (interval - ONE_SECOND))
    });
    currentTime += interval;
  }
  return ranges;
}

function getNumHoursInRange(dateRange) {
  const span = dateRange.end - dateRange.start;
  return span / (1000 * 60 * 60);
}

function getNumDaysFromHours(hours) {
  return Math.round(hours / 24);
}

function getNumDaysInRange(dateRange) {
  return getNumDaysFromHours(getNumHoursInRange(dateRange));
}

function hoursToMs(hours) {
  return hours * 60 * 60 * 1000;
}

function arrayOfObjectsToCSV(arr) {
  return arr.map(function(d){
    return JSON.stringify(Object.values(d));
  })
  .join('\n') 
  .replace(/(^\[)|(\]$)/mg, '');
}

function client_getOAuthToken() {
  try {
    return ScriptApp.getOAuthToken();
  } catch (e) {
    throw new Error(`#getOAuthToken()
      authorization error Failed with error: ${JSON.stringify(e)}
    `);
  }
}

function doGet(event) {
  return HtmlService.createHtmlOutputFromFile('index.html')
  .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
}

async function client_getSetupData() {
  return {
    calendars: CalendarApp.getAllCalendars().map((calendar) => {
      return {
        name: calendar.getName(),
        id: calendar.getId()
      }
    }),
  }
}
