document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for TypeDoc to fully initialize
        // Find the main title link in the toolbar
        const titleLink = document.querySelector('.tsd-toolbar-contents .title');
        if (titleLink) {
            // Change it to point to the main website
            titleLink.href = '/';
            titleLink.textContent = 'LLM.js';
            titleLink.style.fontWeight = 'none !important';
            
            // Add an "API" link next to it
            const apiLink = document.createElement('a');
            apiLink.href = '/docs/modules.html';
            apiLink.textContent = 'API Reference';
            apiLink.style.marginLeft = '1rem';
            apiLink.style.color = '#666666';
            apiLink.style.textDecoration = 'none';
            apiLink.style.fontSize = '0.9em';
            apiLink.style.fontWeight = '800';

            const githubLink = document.createElement('a');
            githubLink.href = 'https://github.com/themaximalist/llm.js';
            githubLink.textContent = 'GitHub';
            githubLink.style.marginLeft = '1rem';
            githubLink.style.color = '#666666';
            githubLink.style.textDecoration = 'none';
            githubLink.style.fontSize = '0.9em';
            
            // Insert after the title
            titleLink.parentNode.insertBefore(githubLink, titleLink.nextSibling);
            titleLink.parentNode.insertBefore(apiLink, titleLink.nextSibling);
        }
        
        // More aggressive settings removal
        const settingsElements = document.querySelectorAll(
            '[class*="settings"], [data-toggle="settings"], .tsd-widget:last-child, [title*="Settings"]'
        );
        settingsElements.forEach(el => el.remove());
        
        // Remove "Generated using TypeDoc" text
        const generatorElements = document.querySelectorAll('.tsd-generator, footer, .tsd-footer');
        generatorElements.forEach(el => el.remove());
        
}); 