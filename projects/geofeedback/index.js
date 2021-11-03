class InteractiveMap {
  constructor(mapId, onClick) {
    this.mapId = mapId;
    this.onClick = onClick;
  }

  async init() {
    await this.injectYMapsScript();
    await this.loadYMaps();
    this.initMap();
  }

  injectYMapsScript() {
    return new Promise((resolve) => {
      const ymapsScript = document.createElement('script');
      ymapsScript.src =
        'https://api-maps.yandex.ru/2.1/?9d14e1a9-13e8-4f88-9cd2-1829de47fbc3&lang=ru_RU';
      document.body.appendChild(ymapsScript);
      ymapsScript.addEventListener('load', resolve);
    });
  }

  loadYMaps() {
    return new Promise((resolve) => ymaps.ready(resolve));
  }

  initMap() {
    this.clusterer = new ymaps.Clusterer({
      groupByCoordinates: true,
      clusterDisableClickZoom: true,
      clusterOpenBalloonOnClick: false,
    });
    this.clusterer.events.add('click', (e) => {
      const coords = e.get('target').geometry.getCoordinates();
      this.onClick(coords);
    });
    this.map = new ymaps.Map(this.mapId, {
      center: [58.0105, 56.2502],
      zoom: 12,
      controls: []
    });
    this.map.events.add('click', (e) => this.onClick(e.get('coords')));
    this.map.geoObjects.add(this.clusterer);
  }

  openBalloon(coords, content) {
    this.map.balloon.open(coords, content);
  }

  setBalloonContent(content) {
    this.map.balloon.setData(content);
  }

  closeBalloon() {
    this.map.balloon.close();
  }

  createPlacemark(coords) {
    const placemark = new ymaps.Placemark(coords);
    placemark.events.add('click', (e) => {
      const coords = e.get('target').geometry.getCoordinates();
      this.onClick(coords);
    });
    this.clusterer.add(placemark);
  }
}

class Review {
  constructor() {
    this.formTemplate = document.querySelector('#addFormTemplate').innerHTML;
    this.map = new InteractiveMap('map', this.onClick.bind(this));
    this.map.init().then(this.onInit.bind(this));
  }

  async onInit() {
    for (let i = 0; i<localStorage.length; i++) {
      if (JSON.parse(localStorage.getItem(localStorage.key(i))).length > 1){
        for (let k = 0; k<JSON.parse(localStorage.getItem(localStorage.key(i))).length; k++){
          this.map.createPlacemark(JSON.parse(localStorage.key(i)));
        }
      }
      else{

        this.map.createPlacemark(JSON.parse(localStorage.key(i)));
      }
    }
    document.body.addEventListener('click', this.onDocumentClick.bind(this));
  }

  

  createForm(coords, reviews) {
    const root = document.createElement('div');
    root.innerHTML = this.formTemplate;
    const reviewList = root.querySelector('.review-list');
    const reviewForm = root.querySelector('[data-role=review-form]');
    reviewForm.dataset.coords = JSON.stringify(coords);

    if (reviews){
      for (const item of reviews) {
        const div = document.createElement('div');
        div.classList.add('review-item');
        div.innerHTML = `
      <div>
        <b>${item.name}</b> [${item.place}]
      </div>
      <div>${item.text}</div>
      `;
        reviewList.appendChild(div);
      }
    }

    return root;
  }

  onClick(coords) {
    const list = JSON.parse(localStorage.getItem(JSON.stringify(coords)));
    const form = this.createForm(coords, list);
    this.map.openBalloon(coords);
    this.map.setBalloonContent(form.innerHTML);
  }

   onDocumentClick(e) {
    if (e.target.dataset.role === 'review-add') {
      let data = [];
      const reviewForm = document.querySelector('[data-role=review-form]');
      const coords = JSON.parse(reviewForm.dataset.coords);
      console.log(coords);
      let reviews = {
        name: document.querySelector('[data-role=review-name]').value,
        place: document.querySelector('[data-role=review-place]').value,
        text: document.querySelector('[data-role=review-text]').value,
      };
      if (JSON.parse(localStorage.getItem(JSON.stringify(coords)))){
        data = JSON.parse(localStorage.getItem(JSON.stringify(coords)));
        data.push(reviews);
      }
      else{
        data.push(reviews);
      }

      try {
        localStorage.setItem(JSON.stringify(coords), JSON.stringify(data));
        this.map.createPlacemark(coords);
        this.map.closeBalloon();
      } catch (e) {
        const formError = document.querySelector('.form-error');
        formError.innerText = e.message;
      }
    }
  }
}

new Review();