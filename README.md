# Google Calendar Time Tracker

### Installation and commands

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

    - The entry file is `src/code.js`. This gets built to `build/<target>/code.gs`, which is a runnable Google Apps Script file.
    - After making changes and any files in the `src/` directory, a `build:<target>` command must be run before those changes will be exectuable by Google Apps Script.
    - While developing, make your changes and then use `reload:<target>` to run both `build:<target>` and `push:<target>` commands.

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