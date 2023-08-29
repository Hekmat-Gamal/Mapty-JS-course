'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class WorkOut {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // [ lat , lng]
    this.duration = duration; // min
    this.distance = distance; // km
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.discription = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()} `;
  }

  click() {
    this.clicks++;
  }
}
class Running extends WorkOut {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends WorkOut {
  type = 'cycling';
  constructor(coords, distance, duration, ElevGain) {
    super(coords, distance, duration);
    this.ElevGain = ElevGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
// let run1 = new Running([39, -12], 5.2, 24, 178);
// let cyc1 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1, cyc1);
class App {
  #map;
  #mapZoomLevel = 12;
  #mapEvent;
  #workouts = [];
  constructor() {
    //Get user location
    this._getPosition();

    //Show History of workouts
    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkOut.bind(this));
    // Changing Running & Cycling
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopUp.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert(`We Couldn't Get Your Geolocation !!`);
        }
      );
    }
  }
  _loadMap(postion) {
    const { latitude } = postion.coords;
    const { longitude } = postion.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        ' ';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 2000);
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  // Form to Enter inputs of workouts
  _newWorkOut(e) {
    e.preventDefault();
    let type = inputType.value;
    let distance = +inputDistance.value;
    let duration = +inputDuration.value;
    let { lat, lng } = this.#mapEvent.latlng;
    let workout;

    let validateinput = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    let allPositive = (...inputs) => inputs.every(inp => inp > 0);
    // running work out
    if (type === 'running') {
      let cadence = +inputCadence.value;
      if (
        !validateinput(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
      )
        return alert('Inputs have to be positive numbers!');
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // cycling workout
    if (type === 'cycling') {
      let elevation = +inputElevation.value;
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(elevation)
        !validateinput(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(workout);
    console.log(workout);

    // Clear Input Fields
    this._hideForm();
    //Display Mark
    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);
    this._setLocalStorage();
  }

  //Show a mark on map
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 300,
          minWidtt: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.discription}`
      )

      .openPopup();
  }
  //Show History of Workouts
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.discription}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>`;
    if (workout.type === 'running')
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>`;

    if (workout.type === 'cycling')
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.ElevGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>`;

    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopUp(el) {
    const workoutEl = el.target;
    // console.log(workoutEl);
    if (!workoutEl) return;

    let workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);
    // console.log(workout);
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 2.5,
      },
    });
    // workout.click();
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    let data = JSON.parse(localStorage.getItem('workouts'));
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
    // console.log(data);
  }
  //Create a puplic method
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

let app = new App();
app._getPosition(); // Cleaner than inside the class
