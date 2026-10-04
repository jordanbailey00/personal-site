export function appearanceControls() {
  return `<div class="appearance-controls" aria-label="Appearance">
<details class="theme-picker style-picker" data-style-picker hidden>
  <summary aria-label="Choose style" title="Style: Classic"><span aria-hidden="true">Aa</span></summary>
  <fieldset class="theme-menu style-menu"><legend>Style</legend>${['Classic', 'Fantasy'].map(label => `<label><input type="radio" name="site-style" value="${label.toLowerCase()}"${label === 'Classic' ? ' checked' : ''}><span class="style-sample sample-${label.toLowerCase()}">${label}</span></label>`).join('')}</fieldset>
</details>
<details class="theme-picker" data-theme-picker hidden>
  <summary aria-label="Choose theme" title="Choose theme"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m14 5 5 5M9 14 20 3a2.1 2.1 0 0 1 3 3L12 17M9 14c-4-1-5 2-5 4 0 2-2 3-2 3s8 2 10-4Z" transform="translate(-1 0)"/></svg></summary>
  <fieldset class="theme-menu"><legend>Theme</legend>${['Auto', 'Light', 'Rust', 'Coal', 'Navy', 'Ayu'].map(label => `<label><input type="radio" name="site-theme" value="${label.toLowerCase()}"${label === 'Auto' ? ' checked' : ''}><span class="theme-swatch swatch-${label.toLowerCase()}" aria-hidden="true"></span>${label}</label>`).join('')}</fieldset>
</details></div>`;
}
