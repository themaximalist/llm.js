document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for TypeDoc to fully initialize
    setTimeout(function() {
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
            apiLink.style.fontWeight = '400';
            
            // Insert after the title
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
        
    }, 200);
}); 