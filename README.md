# What Todo

"What Todo" is a Chrome Extension to replace your "New Tab" page with a todo list experience.


[Install via Chrome WebStore](https://chrome.google.com/webstore/detail/what-todo/plicihhfbemkmlkclkifeeepocjiogcg)

### Features

- **Privacy**: your data is stored in Chrome local storage _only_. It's never sent over the network.
- Tasks from today move to yesterday automatically at 12am.
- Use labels to sort, filter and manage your tasks.
- Use the notes section to manage your notes for the past 6 days + tomorrow.

![What Todo](https://github.com/markmur/what-todo/blob/master/media/screenshot.png)

---

### Development

```sh
# Install dependencies
yarn install

# Run app in development mode
yarn dev
```

#### Load extension in Chrome

1. Go to chrome://extensions
2. Click "Load unpacked" (top left of the page)
3. Choose the `what-todo/dist` folder
4. Open a new tab

---

### Releasing

#### 1. Bump version

Bump the version in the `package.json` file.

#### 2. Create a new release

Run the following script to generate a new release:

```sh
yarn release
```

Releases are created under `releases/what-todo.{version}.zip`.

New releases should be uploaded to the Chrome Web Store manually.
