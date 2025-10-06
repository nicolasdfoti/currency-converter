import CurrencyAPI from '@everapi/currencyapi-js';

const currencyApi = new CurrencyAPI(
  "cur_live_w2ubNCnFp3OsoZN5JKLZMCgt8874oYSMqPb8v2Iq"
);
const latestRatesForm = document.getElementById("latest_rates_form");
const baseCurrencyInput = document.getElementById("base_currency_input");
const currenciesInput = document.getElementById("currencies");
const latestRatesDisplay = document.getElementById("latest_rates_display");
const resultsContainer = document.getElementById("results-container");
const loadingElement = document.getElementById("loading");
const errorMessage = document.getElementById("error-message");
const convertBtn = document.getElementById("convert-btn");
const lastUpdated = document.getElementById("last-updated");

baseCurrencyInput.addEventListener("input", function () {
  this.value = this.value.toUpperCase();
});

currenciesInput.addEventListener("input", function () {
  this.value = this.value.toUpperCase();
});

latestRatesForm.addEventListener("submit", (e) => {
  e.preventDefault();

  errorMessage.classList.remove("show");
  latestRatesDisplay.classList.remove("show");

  const baseCurrency = baseCurrencyInput.value.trim();
  const currencies = currenciesInput.value.replaceAll(" ", "");

  if (!baseCurrency || baseCurrency.length !== 3) {
    showError("Please enter a valid 3-letter base currency code (e.g., USD)");
    return;
  }

  if (!currencies) {
    showError("Please enter at least one target currency");
    return;
  }

  loadingElement.classList.add("show");
  convertBtn.disabled = true;

  currencyApi
    .latest({
      base_currency: baseCurrency,
      currencies: currencies,
    })
    .then((response) => {
      loadingElement.classList.remove("show");
      convertBtn.disabled = false;

      if (response.data) {
        displayResults(response.data);
        updateLastUpdated();
      } else {
        showError("No data received from the API");
      }
    })
    .catch((error) => {
      loadingElement.classList.remove("show");
      convertBtn.disabled = false;
      console.error("API Error:", error);
      showError(
        "Failed to fetch exchange rates. Please check your inputs and try again."
      );
    });
});

function displayResults(data) {
  const currencies = Object.keys(data);

  if (currencies.length === 0) {
    showError("No currency data available for the specified inputs");
    return;
  }

  let resultHTML = "";

  for (let currency of currencies) {
    resultHTML += `
        <div class="result-item">
            <span class="currency-code">${currency}</span>
            <span class="currency-value">${data[currency].value.toFixed(
            4
            )}</span>
        </div>`;
  }

  resultsContainer.innerHTML = resultHTML;
  latestRatesDisplay.classList.add("show");
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add("show");
}

function updateLastUpdated() {
  const now = new Date();
  lastUpdated.textContent = `Updated: ${now.toLocaleTimeString()}`;
}
