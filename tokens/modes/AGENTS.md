# modes

One file per mode, named after the mode (`<mode>.json`) and listed under
the `mode` modifier in `../resolver.json`.

- A mode file holds no values. It picks the theme's group of the same
  name with `$extends` (`"{dark.color}"`), for `color` and `shadow`.
