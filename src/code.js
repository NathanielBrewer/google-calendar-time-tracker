function getFormatedDateTime(date) {
  const dateFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  };

  return `${date.toLocaleDateString('en-US', dateFormatOptions)}, ${getFormatedTime(date)}`
};

function logExecutionInfo(eventName, details) {
  console.info(JSON.stringify({
    app: 'google-calendar-time-tracker',
    event: eventName,
    details: details || {},
  }));
}

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
  logExecutionInfo('compute_results_started');
  try {
    const calendar = CalendarApp.getCalendarById(calendarId);
    if(!calendar) {
      logExecutionInfo('calendar_lookup_completed', {
        successful: false,
      });
      throw new Error('Calendar not found.');
    }
    logExecutionInfo('calendar_lookup_completed', {
      successful: true,
    });

    const interval = hoursToMs(24);
    const dateRanges = getRangesForInterval(dateRange, interval);
    let calendarEventsForRanges = [];
    try {
      calendarEventsForRanges = getCalendarEventsForRanges(calendar, dateRanges);
    } catch (error) {
      logExecutionInfo('calendar_events_gathered', {
        successful: false,
      });
      throw error;
    }
    logExecutionInfo('calendar_events_gathered', {
      successful: true,
      hasTrackableEvents: calendarEventsForRanges.length > 0,
    });

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
    logExecutionInfo('compute_results_completed', {
      successful: true,
      hasResults: appEvents.length > 0,
    });
    return data;
  } catch (error) {
    logExecutionInfo('compute_results_completed', {
      successful: false,
    });
    throw new Error('Unable to compute results.');
  }
}

function getRangesForInterval(dateRange, interval) {
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

function doGet(event) {
  logExecutionInfo('web_app_loaded');
  return HtmlService.createHtmlOutputFromFile('index.html')
  .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
}

async function client_getSetupData() {
  logExecutionInfo('setup_data_requested');
  try {
    const calendars = CalendarApp.getAllCalendars();
    logExecutionInfo('calendars_gathered', {
      successful: true,
      hasCalendars: calendars.length > 0,
    });
    return {
      calendars: calendars.map((calendar) => {
        return {
          name: calendar.getName(),
          id: calendar.getId()
        }
      }),
    }
  } catch (error) {
    logExecutionInfo('calendars_gathered', {
      successful: false,
    });
    throw new Error('Unable to load calendars.');
  }
}

function client_logInvoiceEvent(eventName, status) {
  const allowedEvents = {
    invoice_generated: true,
    invoice_pdf_downloaded: true,
    invoice_svg_downloaded: true,
  };
  const allowedStatuses = {
    success: true,
    failure: true,
  };
  if(!allowedEvents[eventName] || !allowedStatuses[status]) {
    logExecutionInfo('invoice_activity_log_rejected');
    return;
  }
  logExecutionInfo(eventName, {
    successful: status === 'success',
  });
}

function client_getInvoiceTemplates() {
  logExecutionInfo('invoice_templates_requested');
  try {
    const templates = {
      pageWithTotals: HtmlService.createHtmlOutputFromFile('invoice-builder/pageWithTotals').getContent(),
      pageWithoutTotals: HtmlService.createHtmlOutputFromFile('invoice-builder/pageWithoutTotals').getContent(),
    };
    logExecutionInfo('invoice_templates_loaded', {
      successful: true,
    });
    return templates;
  } catch (error) {
    logExecutionInfo('invoice_templates_loaded', {
      successful: false,
    });
    throw new Error('Unable to load invoice templates.');
  }
}
