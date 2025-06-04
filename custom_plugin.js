import { Application, DefaultTheme } from "typedoc";

export function load(app) {
    app.renderer.defineTheme("mydefault", DefaultTheme);
}