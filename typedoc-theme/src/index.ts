import { Application } from "typedoc";
import { readFileSync } from "fs";
import { join, dirname } from "path";

export function load(app: Application): void {
    // Add custom CSS using the head.end hook
    app.renderer.hooks.on("head.end", () => {
        console.log("Plugin is running!"); // Debug log
        
        try {
            // Try to read the CSS file
            const cssPath = join(dirname(dirname(__filename)), "assets", "minimalist.css");
            console.log("Looking for CSS at:", cssPath); // Debug log
            const cssContent = readFileSync(cssPath, "utf-8");
            console.log("CSS loaded successfully"); // Debug log
            return `<style>${cssContent}</style>`;
        } catch (error) {
            console.log("CSS file not found, using fallback:", (error as Error).message); // Debug log
            // Fallback: just hide settings
            return `<style>
                body { border: 5px solid red !important; } /* Debug border */
                .tsd-page-toolbar .tsd-toolbar-contents > *:last-child,
                .tsd-page-toolbar .tsd-toolbar-icon.settings,
                .tsd-widget,
                .tsd-widget.settings {
                    display: none !important;
                }
            </style>`;
        }
    });

    // Modify the navigation in the rendered HTML
    app.renderer.hooks.on("body.end", () => {
        return `<script>
            document.addEventListener('DOMContentLoaded', function() {
                // Find the main title link in the toolbar
                const titleLink = document.querySelector('.tsd-toolbar-contents .title');
                if (titleLink) {
                    // Change it to point to the main website
                    titleLink.href = 'https://llmjs.themaximalist.com';
                    titleLink.target = '_blank';
                    
                    // Add an "API" link next to it
                    const apiLink = document.createElement('a');
                    apiLink.href = 'index.html';
                    apiLink.textContent = 'API';
                    apiLink.style.marginLeft = '1rem';
                    apiLink.style.color = '#666666';
                    apiLink.style.textDecoration = 'none';
                    apiLink.style.fontSize = '0.9em';
                    
                    // Insert after the title
                    titleLink.parentNode.insertBefore(apiLink, titleLink.nextSibling);
                }
                
                // More aggressive settings removal
                const settingsElements = document.querySelectorAll(
                    '[class*="settings"], [data-toggle="settings"], .tsd-widget:last-child'
                );
                settingsElements.forEach(el => el.remove());
            });
        </script>`;
    });
} 