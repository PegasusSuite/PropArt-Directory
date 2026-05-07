/**
 * PropArt™ Studio — polymer clay calculators & exports (migrated from Creator Space).
 */
(function () {
    'use strict';

    var materials = [];
    var timerInterval = null;
    var timerSeconds = 0;
    var timerRunning = false;

    function notifyInline(message, hint) {
        var el = document.getElementById('clay-tools-toast');
        if (!el) {
            window.alert(String(message) + (hint ? '\n' + hint : ''));
            return;
        }
        el.textContent = hint ? String(message) + ' — ' + String(hint) : String(message);
        el.classList.add('show');
        clearTimeout(el._hideT);
        el._hideT = setTimeout(function () {
            el.classList.remove('show');
        }, 3200);
    }

    function toolkitUserLabel() {
        var pn = document.getElementById('project-name-input');
        var v = pn && pn.value ? String(pn.value).trim() : '';
        return v || 'PropArt Studio';
    }

    function hexToRgbTuple(hex) {
        var h = String(hex || '').replace('#', '');
        if (h.length !== 6) return [128, 128, 128];
        return [
            parseInt(h.slice(0, 2), 16),
            parseInt(h.slice(2, 4), 16),
            parseInt(h.slice(4, 6), 16)
        ];
    }

    function unlockBadge() {
        /* Studio: gamification lives on Creator Space */
    }

    function calculateClayCost() {
        var price = parseFloat(document.getElementById('clayPrice').value);
        var oz = parseFloat(document.getElementById('clayOz').value);
        var resultDiv = document.getElementById('costResult');

        if (isNaN(price) || isNaN(oz)) {
            notifyInline('Please enter valid numbers!');
            return;
        }

        var total = (price * oz).toFixed(2);
        resultDiv.innerHTML = 'Total Cost: $' + total;
        resultDiv.style.display = 'block';
        unlockBadge('tool-user');
    }

    function mixColors() {
        var color1 = document.getElementById('color1').value;
        var color2 = document.getElementById('color2').value;

        var r1 = parseInt(color1.substr(1, 2), 16);
        var g1 = parseInt(color1.substr(3, 2), 16);
        var b1 = parseInt(color1.substr(5, 2), 16);

        var r2 = parseInt(color2.substr(1, 2), 16);
        var g2 = parseInt(color2.substr(3, 2), 16);
        var b2 = parseInt(color2.substr(5, 2), 16);

        var rMix = Math.round((r1 + r2) / 2);
        var gMix = Math.round((g1 + g2) / 2);
        var bMix = Math.round((b1 + b2) / 2);

        var mixed =
            '#' +
            rMix.toString(16).padStart(2, '0') +
            gMix.toString(16).padStart(2, '0') +
            bMix.toString(16).padStart(2, '0');

        document.getElementById('mixedColor').style.background = 'rgb(' + rMix + ',' + gMix + ',' + bMix + ')';
        unlockBadge('color-mixer');
    }

    function startTimer() {
        if (timerRunning) return;
        timerRunning = true;
        timerInterval = setInterval(function () {
            timerSeconds++;
            updateTimerDisplay();
        }, 1000);
        unlockBadge('time-tracker');
    }

    function pauseTimer() {
        timerRunning = false;
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function resetTimer() {
        pauseTimer();
        timerSeconds = 0;
        updateTimerDisplay();
    }

    function updateTimerDisplay() {
        var hours = Math.floor(timerSeconds / 3600);
        var minutes = Math.floor((timerSeconds % 3600) / 60);
        var seconds = timerSeconds % 60;
        var display =
            hours.toString().padStart(2, '0') +
            ':' +
            minutes.toString().padStart(2, '0') +
            ':' +
            seconds.toString().padStart(2, '0');
        var displayEl = document.getElementById('timerDisplay');
        if (displayEl) displayEl.textContent = display;
    }

    function convertTemp() {
        var temp = parseFloat(document.getElementById('tempInput').value);
        var from = document.getElementById('tempFrom').value;
        var resultDiv = document.getElementById('tempResult');

        if (isNaN(temp)) {
            notifyInline('Please enter a valid temperature!');
            return;
        }

        var result;
        if (from === 'f') {
            result = ((temp - 32) * 5 / 9).toFixed(1);
            resultDiv.innerHTML = temp + '°F = ' + result + '°C';
        } else {
            result = (temp * 9 / 5 + 32).toFixed(1);
            resultDiv.innerHTML = temp + '°C = ' + result + '°F';
        }
        resultDiv.style.display = 'block';
    }

    function addMaterial() {
        var name = document.getElementById('materialName').value;
        var cost = parseFloat(document.getElementById('materialCost').value);

        if (!name || isNaN(cost)) {
            notifyInline('Please enter material name and cost!');
            return;
        }

        materials.push({ name: name, cost: cost });
        document.getElementById('materialName').value = '';
        document.getElementById('materialCost').value = '';
        updateMaterialList();
    }

    function updateMaterialList() {
        var listDiv = document.getElementById('materialList');
        var totalDiv = document.getElementById('materialTotal');

        if (materials.length === 0) {
            listDiv.innerHTML = '<em>No materials added yet</em>';
            totalDiv.style.display = 'none';
            return;
        }

        var html = '<strong>Materials:</strong><br>';
        var total = 0;

        materials.forEach(function (mat, index) {
            html += index + 1 + '. ' + mat.name + ': $' + mat.cost.toFixed(2) + '<br>';
            total += mat.cost;
        });

        listDiv.innerHTML = html;
        totalDiv.innerHTML = 'Total Materials: $' + total.toFixed(2);
        totalDiv.style.display = 'block';
    }

    function calculateProfit() {
        var materialCost = parseFloat(document.getElementById('materialCostProfit').value);
        var hours = parseFloat(document.getElementById('laborHours').value);
        var rate = parseFloat(document.getElementById('hourlyRate').value);
        var resultDiv = document.getElementById('profitResult');

        if (isNaN(materialCost) || isNaN(hours) || isNaN(rate)) {
            notifyInline('Please fill in all fields!');
            return;
        }

        var laborCost = hours * rate;
        var totalCost = materialCost + laborCost;
        var suggestedPrice = (totalCost * 2).toFixed(2);

        resultDiv.innerHTML =
            'Material: $' +
            materialCost.toFixed(2) +
            '<br>Labor: $' +
            laborCost.toFixed(2) +
            '<br><strong>Total Cost: $' +
            totalCost.toFixed(2) +
            '</strong><br><strong>Suggested Price: $' +
            suggestedPrice +
            '</strong>';
        resultDiv.style.display = 'block';
    }

    function saveColorRecipePDF() {
        var color1 = document.getElementById('color1') && document.getElementById('color1').value;
        var color2 = document.getElementById('color2') && document.getElementById('color2').value;
        var mixedColorEl = document.getElementById('mixedColor');

        if (!color1 || !color2 || !mixedColorEl || !mixedColorEl.style.background) {
            notifyInline('Please mix colors first before saving to PDF!');
            return;
        }

        var mixedColor = mixedColorEl.style.background;

        if (typeof window.jspdf === 'undefined') {
            notifyInline('PDF library not loaded. Refresh and try again.');
            return;
        }

        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF();

        doc.setFontSize(22);
        doc.setTextColor(217, 106, 138);
        doc.text('Color Mixing Recipe', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Created: ' + new Date().toLocaleDateString(), 105, 28, { align: 'center' });

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Recipe:', 20, 45);

        doc.setFontSize(12);
        doc.text('Color 1:', 30, 60);
        doc.setFillColor.apply(doc, hexToRgbTuple(color1));
        doc.rect(70, 53, 30, 10, 'F');
        doc.text(color1.toUpperCase(), 105, 60);

        doc.setFontSize(16);
        doc.text('+', 95, 80);

        doc.setFontSize(12);
        doc.text('Color 2:', 30, 95);
        doc.setFillColor.apply(doc, hexToRgbTuple(color2));
        doc.rect(70, 88, 30, 10, 'F');
        doc.text(color2.toUpperCase(), 105, 95);

        doc.setFontSize(16);
        doc.text('=', 95, 115);

        doc.setFontSize(12);
        doc.text('Mixed Color:', 30, 130);

        var rgb = mixedColor.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
            doc.setFillColor(parseInt(rgb[0], 10), parseInt(rgb[1], 10), parseInt(rgb[2], 10));
            doc.rect(70, 123, 30, 10, 'F');

            var hexMixed =
                '#' +
                parseInt(rgb[0], 10).toString(16).padStart(2, '0') +
                parseInt(rgb[1], 10).toString(16).padStart(2, '0') +
                parseInt(rgb[2], 10).toString(16).padStart(2, '0');
            doc.text(hexMixed.toUpperCase(), 105, 130);
        }

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(toolkitUserLabel() + ' — PropArt Studio', 105, 285, { align: 'center' });

        doc.save('color-recipe-' + new Date().getTime() + '.pdf');
        notifyInline('Color recipe saved as PDF!');
        unlockBadge('pdf-export');
    }

    function saveMaterialsPDF() {
        if (materials.length === 0) {
            notifyInline('No materials to export! Add materials first.');
            return;
        }

        if (typeof window.jspdf === 'undefined') {
            notifyInline('PDF library not loaded. Refresh and try again.');
            return;
        }

        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF();

        doc.setFontSize(22);
        doc.setTextColor(217, 106, 138);
        doc.text('Material Cost Report', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Generated: ' + new Date().toLocaleString(), 105, 28, { align: 'center' });

        var timerNoteEl = document.getElementById('timerNote');
        var projectNote = (timerNoteEl && timerNoteEl.value) || toolkitUserLabel();

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Project: ' + projectNote, 20, 45);

        doc.setFontSize(11);
        doc.setFillColor(217, 106, 138);
        doc.rect(20, 55, 170, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text('#', 25, 62);
        doc.text('Material Name', 40, 62);
        doc.text('Cost', 160, 62, { align: 'right' });

        doc.setTextColor(0, 0, 0);
        var yPos = 72;
        var total = 0;

        materials.forEach(function (mat, index) {
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
            if (index % 2 === 0) {
                doc.setFillColor(245, 245, 245);
                doc.rect(20, yPos - 7, 170, 10, 'F');
            }
            doc.setFontSize(10);
            doc.text(String(index + 1), 25, yPos);
            doc.text(mat.name, 40, yPos);
            doc.text('$' + mat.cost.toFixed(2), 160, yPos, { align: 'right' });
            total += mat.cost;
            yPos += 10;
        });

        yPos += 5;
        doc.setDrawColor(217, 106, 138);
        doc.setLineWidth(0.5);
        doc.line(20, yPos, 190, yPos);
        yPos += 10;

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('TOTAL MATERIALS:', 40, yPos);
        doc.setTextColor(217, 106, 138);
        doc.text('$' + total.toFixed(2), 160, yPos, { align: 'right' });

        yPos += 15;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text('Pricing suggestions:', 20, yPos);
        yPos += 10;
        doc.setFontSize(9);
        doc.text('• 2x markup: $' + (total * 2).toFixed(2), 25, yPos);
        yPos += 7;
        doc.text('• 3x markup: $' + (total * 3).toFixed(2), 25, yPos);
        yPos += 7;
        doc.text('• 4x markup: $' + (total * 4).toFixed(2), 25, yPos);

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(toolkitUserLabel() + ' — PropArt Studio', 105, 285, { align: 'center' });

        doc.save(
            'materials-' +
                projectNote.replace(/\s+/g, '-').toLowerCase().slice(0, 40) +
                '-' +
                new Date().getTime() +
                '.pdf'
        );
        notifyInline('Materials report exported as PDF!');
        unlockBadge('pdf-export');
    }

    window.calculateClayCost = calculateClayCost;
    window.mixColors = mixColors;
    window.startTimer = startTimer;
    window.pauseTimer = pauseTimer;
    window.resetTimer = resetTimer;
    window.convertTemp = convertTemp;
    window.addMaterial = addMaterial;
    window.calculateProfit = calculateProfit;
    window.saveColorRecipePDF = saveColorRecipePDF;
    window.saveMaterialsPDF = saveMaterialsPDF;

    function openToolkitFromHash() {
        if (location.hash !== '#clay-premium-tools') return;
        var btn = document.getElementById('tab-btn-tools');
        if (btn) btn.click();
        setTimeout(function () {
            var sec = document.getElementById('clay-premium-tools');
            if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
    }

    document.addEventListener('DOMContentLoaded', function () {
        updateTimerDisplay();
        openToolkitFromHash();
        window.addEventListener('hashchange', openToolkitFromHash);
    });
})();
