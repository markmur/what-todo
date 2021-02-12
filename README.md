# What Todo

"What Todo" is a Chrome Extension to replace your "New Tab" page with a todo list experience.

### Features

- **Privacy**: your data is stored in Chrome local storage _only_. It's never sent over the network.
- Tasks from today move to yesterday automatically at 12am.
- Use labels to sort, filter and manage your tasks.
- Use the notes section to manage your notes for the past 6 days + tomorrow.

![What Todo](https://github.com/markmur/what-todo/blob/master/media/what-todo.png)

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

### Releasing

Steps:

#### Bump version

Bump the version in the `package.json` file.

#### Create a new release

Run the following script to generate a new release:

```sh
yarn release
```
