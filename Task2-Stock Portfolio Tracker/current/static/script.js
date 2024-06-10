var tickers = JSON.parse(localStorage.getItem('tickers')) || [];
var lastPrices = {};
var counter = 12;

function startUpdateCycle() {
    updatePrices();
    var countdown = setInterval(function () {
        counter--;
        $('#counter').text(counter);
        if (counter <= 0) {
            updatePrices();
            counter = 15;
        }
    }, 1000);
}

$(document).ready(function () {
    tickers.forEach(function (ticker) {
        addTickerToGrid(ticker);
    });

    updatePrices();
    $('#add-ticker-form').submit(function (e) {
        e.preventDefault();
        var newTicker = $('#new-ticker').val().toUpperCase();
        var shares = parseInt($('#share-quantity').val()); // Get number of shares
        if (!tickers.includes(newTicker)) {
            tickers.push(newTicker);
            localStorage.setItem('tickers', JSON.stringify(tickers));
            addTickerToGrid(newTicker, shares); // Pass shares to addTickerToGrid
        }
        $('#new-ticker').val('');
        $('#share-quantity').val(''); // Clear share input
        updatePrices();
    });
    $('#tickers-grid').on('click', '.remove-btn', function () {
        var tickerToRemove = $(this).data('ticker');
        tickers = tickers.filter(t => t != tickerToRemove);
        localStorage.setItem('tickers', JSON.stringify(tickers));
        $('#' + tickerToRemove).remove();
    });

    startUpdateCycle();
});

function addTickerToGrid(ticker, shares) {
    $('#tickers-grid').append(`
        <div id="${ticker}" class="stock-box">
            <h2>${ticker}</h2>
            <p>Shares: <span class="shares">${shares}</span></p>
            <p id="${ticker}-price"></p>
            <p id="${ticker}-pct"></p>
            <button class="remove-btn" data-ticker="${ticker}">Remove</button>
        </div>
    `);
}

function updatePrices() {
    tickers.forEach(function (ticker) {
        $.ajax({
            url: '/get_stock_data',
            type: 'POST',
            data: JSON.stringify({ "ticker": ticker }),
            contentType: 'application/json',
            dataType: 'json',
            success: function (data) {
                var changePercent = ((data.currentPrice - data.openPrice) / data.openPrice) * 100;
                var colourClass;
                if (changePercent <= -2) {
                    colourClass = 'dark-red';
                } else if (changePercent < 0) {
                    colourClass = 'red';
                } else if (changePercent == 0) {
                    colourClass = 'gray';
                } else if (changePercent <= 2) {
                    colourClass = 'green';
                } else if (changePercent > 2) {
                    colourClass = 'dark-green';
                }

                $('#' + ticker + '-price').text('$' + data.currentPrice.toFixed(2));
                $('#' + ticker + '-pct').text(changePercent.toFixed(2) + '%');
                $('#' + ticker + '-pct').removeClass('dark-red red gray green dark-green').addClass(colourClass);

                var flashClass;
                if (lastPrices[ticker] > data.currentPrice) {
                    flashClass = "red-flash";
                } else if (lastPrices[ticker] < data.currentPrice) {
                    flashClass = 'green-flash';
                } else {
                    flashClass = 'gray-flash';
                }
                lastPrices[ticker] = data.currentPrice;

                $('#' + ticker).addClass(flashClass);
                setTimeout(function () {
                    $('#' + ticker).removeClass(flashClass);
                }, 1000);
                
                // Call updateTotalAmount after updating prices
                updateTotalAmount();
            }
        });
    });
}

function updateTotalAmount() {
    var totalAmount = 0;
    tickers.forEach(function (ticker) {
        $.ajax({
            url: '/get_stock_data',
            type: 'POST',
            data: JSON.stringify({ "ticker": ticker }),
            contentType: 'application/json',
            dataType: 'json',
            success: function (data) {
                var currentPrice = data.currentPrice;
                var shares = parseInt($('#' + ticker + ' .shares').text()); // Get number of shares from the stock box
                var amountForTicker = shares * currentPrice;
                totalAmount += amountForTicker;
                $('#total-amount').text('$' + totalAmount.toFixed(2));
            }
        });
    });
}
