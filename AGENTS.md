<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep sample driver-location data and status eligibility in a browser-safe module separate from the map display, so demo tracking does not imply live GPS updates.
- Render Google Maps through the browser Embed API only on authorized, credential-free HTTPS origins; this avoids exposing preview access keys or making unsupported server calls.
