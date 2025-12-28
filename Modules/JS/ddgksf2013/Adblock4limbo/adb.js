(function () {
  const currentScript = document.currentScript;
  const placeId = currentScript.getAttribute('data-adxad-place');

  function setPlace(placeId) {
    const screen = `${window.screen.width}x${window.screen.height}`;
    const ref = window.top === window.self ? document.URL : document.referrer;

    const existingIframe = document.querySelector(`iframe[data-place-id="${placeId}"]`);
    if (existingIframe) return;

    const placeElement = document.getElementById(placeId);
    if (!placeElement) return;

    const { width, height, tags = "", output = "img", extra1 = "0" } = placeElement.dataset;
    if (!width || !height) return;

    const encodedRef = encodeURIComponent(ref);
    const encodedScreen = encodeURIComponent(screen);
    const timestamp = Date.now();

    placeElement.innerHTML = `<iframe data-place-id="${placeId}" frameborder="0" scrolling="no" width="${width}" height="${height}" src="https://ads.adxadserv.com/ad?spotid=${placeId}&type=${width}x${height}&output=${output}&extra1=${extra1}&ref=${encodedRef}&dt=${timestamp}&screen=${encodedScreen}&tags=${encodeURIComponent(tags)}" sandbox="allow-scripts allow-forms allow-popups allow-same-origin" allowfullscreen="false" style="width: ${width}px; height: ${height}px;"></iframe>`;
  }

  setPlace(placeId);
})();
