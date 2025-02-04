# Google Calendar Time Tracker

## Description

This is a Google Apps Script Web App that, given a Google calendar and date range, provides a summary of the total hours and number of events during the range as well as details for each event.

The interface looks like this:   
![Interface screenshot](/assets/images/interface.png)
   
And the output looks like this:
> SUMMARY:   
Calendar name: Google Calendar Time Tracker   
Start date: Tuesday, Jan 28, 12:00 AM   
End date: Friday, Jan 31, 11:59 PM   
Number of events: 2   
Total hours: 3.25   
>   
>EVENTS:   
Date: Tuesday, Jan 28, 10:00 AM 
Title: Call with team   
Start: 10:00 AM   
End: 11:00 AM 
Hours: 1   
>
>Date: Wednesday, Jan 29, 9:45 AM   
Title: Doing the work   
Start: 9:45 AM   
End: 12:00 PM   
Hours: 2.25      

### Example usage

- Create a calendar for a project you're starting
- Each time you spend time on the project:
    - Create a project calendar event
    - Give it a descriptive title like "Initial project configuration"
    - Set the duration to the amount of time you spent
- Use the Google Calendar Time Tracker weekly to review your time spent on the project

### Only number of users and executions data are collected

This web app collects no information about users or their Google accounts. You can verify this by inspecting the source code in `/src/code.js`.      

### Try it out

Access the latest version of the Google Calendar Time Tracker [here](1-n20wIm5xcJuWcTAHmHBMyWotAZxCUS-hC-0yKcsM7U5Lz9sgvVZL8zI).   
Since this web app is not published through Google, you will need to click through the security warnings.

## Installation and commands

1. **Clone the repository** 

   ```bash
   git clone https://github.com/NathanielBrewer/google-calendar-time-tracker.git
   cd google-calendar-time-tracker
   ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Configure Google Apps Script**

    - Navigate to your Google Apps Script project and open the Project Settings
    - Copy the Script ID and paste it into either the `devScriptId`, `prodScriptId`, or the `scriptId` variable in the .clasp.json file located at `src/.clasp.json`
    - Adjust the appscript.json as needed. Documentation available [here](https://developers.google.com/apps-script/manifest)

4. **Develop**

    - The entry file is `src/code.js`. This gets built to `build/<prod|dev>/code.gs`, which is a runnable Google Apps Script file.
    - After making changes and any files in the `src/` directory, a `build:<prod|dev>` command must be run before those changes will be exectuable by Google Apps Script.
    - While developing, make your changes and then use `reload:<prod|dev>` to run both `build:<prod|dev>` and `push:<prod|dev>` commands.

5. **Build**

    The build step is required to convert the files into a single Google Script file that can then be pushed and deployed to your Apps Script project.

    Command:
    ```bash
    npm run build:<prod|dev>
    ```

6. **Push**

    Invoke `clasp push` for either the `prod` or `dev` script ID
  
    ```bash
    npm run push:<prod|dev>
    ```

7. **Deploy**

    Invoke `clasp deploy` for either the `prod` or `dev` script ID
  
    ```bash
    npm run deploy:<prod|dev>
    ```

8. **Reload**

    For faster development, build and push in one command

    ```bash
    npm run reload:<prod|dev>
    ```