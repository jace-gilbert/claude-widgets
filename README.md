# claude-widgets

Display code for inline Claude chat widgets, served through jsDelivr. No personal data lives here: Claude passes the data in when it renders a widget.

## resume-picker.js

A Todoist-style picker for open Resume 🔥 tasks, used by the `resume-task` skill.

```html
<div id="rp"></div>
<script src="https://cdn.jsdelivr.net/gh/jace-gilbert/claude-widgets@<commit>/resume-picker.js"></script>
<script>renderResumePicker(document.getElementById('rp'), [/* tasks */])</script>
```

Pin a commit SHA in the URL, so editing this file never changes a picker until the skill is updated to the new SHA. The data format is documented at the top of the file.
