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

const validateInputs = (baseCurrency, currencies) => {
  const errors = [];

  const currencyCodes = currencies.split(',')
    .map(code => code.trim())
    .filter(code => code.length > 0);
  
  if (!baseCurrency || baseCurrency.length !== 3) {
    errors.push("Please enter a valid 3-letter base currency code (e.g., USD)");
  }
  
  if (currencyCodes.length === 0) {
    errors.push("Please enter at least one target currency");
  }

  const invalidCodes = currencyCodes.some(code => code.length !== 3);
  if (invalidCodes) {
    errors.push("All currency codes must be 3 letters long");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    currencyCodes
  };
};

const formatCurrencyValue = (value, depth = 0) => {

  if (value < 1000 || depth >= 2) {
    return value.toFixed(4);
  }

  const remainder = value % 1000;
  const quotient = Math.floor(value / 1000);
  
  if (remainder === 0) {
    return formatCurrencyValue(quotient, depth + 1) + ",000";
  } else {
    const formattedRemainder = remainder.toString().padStart(3, '0');
    return formatCurrencyValue(quotient, depth + 1) + "," + formattedRemainder;
  }
};

const validateApiResponse = (response) => {
  if (!response) {
    throw new Error("API returned no response");
  }
  
  if (!response.data) {
    throw new Error("No currency data available in API response");
  }
  
  const currencies = Object.keys(response.data);
  if (currencies.length === 0) {
    throw new Error("No currency data available for the specified inputs");
  }
  
  return response;
};

baseCurrencyInput.addEventListener("input", function () {
  this.value = this.value.toUpperCase();
});

currenciesInput.addEventListener("input", function () {
  this.value = this.value.toUpperCase();
});

latestRatesForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  errorMessage.classList.remove("show");
  latestRatesDisplay.classList.remove("show");

  const baseCurrency = baseCurrencyInput.value.trim();
  const currencies = currenciesInput.value;

  const validation = validateInputs(baseCurrency, currencies);
  
  if (!validation.isValid) {
    showError(validation.errors.join(". "));
    return;
  }

  loadingElement.classList.add("show");
  convertBtn.disabled = true;

  try {
    const response = await currencyApi.latest({
      base_currency: baseCurrency,
      currencies: validation.currencyCodes.join(',')
    });

    const validatedResponse = validateApiResponse(response);
    
    loadingElement.classList.remove("show");
    convertBtn.disabled = false;

    displayResults(validatedResponse.data);
    updateLastUpdated();
    
  } catch (error) {
    loadingElement.classList.remove("show");
    convertBtn.disabled = false;
    console.error("API Error:", error);

    if (error instanceof Error) {
      showError(`Error: ${error.message}`);
    } else {
      showError("Failed to fetch exchange rates. Please check your inputs and try again.");
    }
  }
});

function displayResults(data) {

  const resultHTML = Object.entries(data)
    .map(([currency, info]) => {

      const formattedValue = formatCurrencyValue(info.value);
      
      return `
        <div class="result-item">
          <span class="currency-code">${currency}</span>
          <span class="currency-value">${formattedValue}</span>
        </div>`;
    })
    .join('');

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

const getTopCurrencies = (data, limit = 3) => {
  return Object.entries(data)
    .sort(([, a], [, b]) => b.value - a.value)
    .slice(0, limit)
    .reduce((acc, [currency, info]) => {
      acc[currency] = info;
      return acc;
    }, {});
};