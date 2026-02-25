let valorCalculado = 0;

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function calcular() {
    const altura = parseFloat(document.getElementById("altura").value);
    const largura = parseFloat(document.getElementById("largura").value);
    const alturaCor = parseFloat(document.getElementById("alturaCor").value);
    const larguraCor = parseFloat(document.getElementById("larguraCor").value);
    const resultadoEl = document.getElementById("resultado");

    if (isNaN(altura) || isNaN(largura)) {
        resultadoEl.classList.replace("alert-info", "alert-danger");
        resultadoEl.textContent = "Por favor, preencha a altura e largura principais.";
        valorCalculado = 0;
        return;
    }

    let total = (altura * largura * 0.225) + 32;

    if (!isNaN(alturaCor) && !isNaN(larguraCor)) {
        total += (alturaCor * larguraCor * 0.225) + 32;
    }

    valorCalculado = total;
    resultadoEl.classList.replace("alert-danger", "alert-info");
    resultadoEl.textContent = `Orçamento: ${formatarMoeda(total)}`;
}

function copiarValor() {

    const texto = `*ORÇAMENTO -*: ${formatarMoeda(valorCalculado)}`;

    navigator.clipboard.writeText(texto).then(() => {

        const btnCopiar = document.getElementById("btnCopiar");

        // Troca para ícone de sucesso
        btnCopiar.innerHTML = `<i class="fa-solid fa-check"></i>`;
        btnCopiar.style.color = "#28a745"; // verde sucesso

        setTimeout(() => {
            // Volta para ícone de copiar
            btnCopiar.innerHTML = `<i class="fa-solid fa-copy"></i>`;
            btnCopiar.style.color = "#ffffff";
        }, 1500);

    });

}

function limparCampos() {

    // Limpa todos os inputs (number, text, file)
    document.querySelectorAll("input").forEach(input => {
        input.value = "";
    });

    // 🔥 Reset do select de modelo
    const selectModelo = document.querySelector("select");
    if (selectModelo) {
        selectModelo.selectedIndex = 0;
    }

    // Limpa resultado
    document.getElementById("resultado").textContent = "R$ 0,00";

    // Limpa lista de cores detectadas
    const listaCores = document.getElementById("listaCores");
    if (listaCores) {
        listaCores.innerHTML = "";
    }

    // Remove seleção visual das cores
    document.querySelectorAll(".cor-item").forEach(item => {
        item.classList.remove("cor-selecionada");
    });

    // Limpa canvas
    const canvas = document.getElementById("canvasImagem");
    if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

}

function selecionarModelo(select) {

    if (!select.value) return;

    const medidas = select.value.split("x");

    const largura = parseFloat(medidas[0]);
    const altura = parseFloat(medidas[1]);

    // Preenche campos principais
    document.getElementById("largura").value = largura;
    document.getElementById("altura").value = altura;

    // Preenche também área total real
    document.getElementById("larguraReal").value = largura;
    document.getElementById("alturaReal").value = altura;
}

// Sincroniza manualmente se alterar campos principais
document.getElementById("largura").addEventListener("input", function () {
    document.getElementById("larguraReal").value = this.value;
});

document.getElementById("altura").addEventListener("input", function () {
    document.getElementById("alturaReal").value = this.value;
});

function hexToRgb(hex) {
    hex = hex.replace("#", "");
    const bigint = parseInt(hex, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

function analisarImagem() {

    const fileInput = document.getElementById("inputImagem");
    const file = fileInput.files[0];
    if (!file) return alert("Selecione uma imagem");

    const larguraReal = parseFloat(document.getElementById("larguraReal").value);
    const alturaReal = parseFloat(document.getElementById("alturaReal").value);
    const hex = document.getElementById("corHex").value;

    if (!larguraReal || !alturaReal || !hex) {
        return alert("Preencha todas as informações");
    }

    const rgbAlvo = hexToRgb(hex);
    const tolerancia = 25;

    const img = new Image();

    img.onload = function () {

        const canvas = document.getElementById("canvasImagem");
        const ctx = canvas.getContext("2d");

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let minX = canvas.width;
        let minY = canvas.height;
        let maxX = 0;
        let maxY = 0;

        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {

                const index = (y * canvas.width + x) * 4;

                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];

                if (
                    Math.abs(r - rgbAlvo.r) < tolerancia &&
                    Math.abs(g - rgbAlvo.g) < tolerancia &&
                    Math.abs(b - rgbAlvo.b) < tolerancia
                ) {
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                }
            }
        }

        const larguraPx = maxX - minX;
        const alturaPx = maxY - minY;

        const larguraCm = (larguraPx / canvas.width) * larguraReal;
        const alturaCm = (alturaPx / canvas.height) * alturaReal;

        document.getElementById("larguraCor").value = larguraCm.toFixed(2);
        document.getElementById("alturaCor").value = alturaCm.toFixed(2);

        // 🔥 AGORA sim exibe o modal
        const modal = new bootstrap.Modal(document.getElementById('modalSucesso'));
        modal.show();

        setTimeout(() => {
            modal.hide();
        }, 2000);
    };

    img.src = URL.createObjectURL(file);
}

document.getElementById("inputImagem").addEventListener("change", analisarCores);

function analisarCores(event) {

    const file = event.target.files[0];
    if (!file) return;

    const img = new Image();

    img.onload = function () {

        const canvas = document.getElementById("canvasImagem");
        const ctx = canvas.getContext("2d");

        const escala = 0.6;

        canvas.width = img.width * escala;
        canvas.height = img.height * escala;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const cores = [];
        const totalPixels = canvas.width * canvas.height;
        const tolerancia = 25;

        for (let i = 0; i < data.length; i += 4) {

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            let encontrada = false;

            for (let cor of cores) {

                const dist = Math.sqrt(
                    (r - cor.r) ** 2 +
                    (g - cor.g) ** 2 +
                    (b - cor.b) ** 2
                );

                if (dist < tolerancia) {
                    cor.count++;
                    encontrada = true;
                    break;
                }
            }

            if (!encontrada) {
                cores.push({ r, g, b, count: 1 });
            }
        }

        const coresFiltradas = cores
            .map(cor => ({
                ...cor,
                porcentagem: (cor.count / totalPixels) * 100
            }))
            .filter(cor => cor.porcentagem > 0.05)
            .sort((a, b) => b.porcentagem - a.porcentagem);

        const container = document.getElementById("listaCores");
        container.innerHTML = "";

        coresFiltradas.forEach(cor => {

            const hex = rgbToHex(cor.r, cor.g, cor.b);

            container.innerHTML += `
    <div class="cor-item"
         onclick="copiarCor('${hex}', this)">

        <div class="cor-preview" style="background:${hex}"></div>

        <div>
            <div class="hex-text">${hex}</div>
            <div style="font-size:0.75rem;color:#aaa">
                ${cor.porcentagem.toFixed(2)}% da arte
            </div>
        </div>

        <div class="copy-icon">
            <i class="fa-solid fa-copy"></i>
        </div>

    </div>
`;
        });

    };

    img.src = URL.createObjectURL(file);
}

function rgbToHex(r, g, b) {
    return "#" + [r, g, b]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
}

function copiarCor(hex, elemento) {

    navigator.clipboard.writeText(hex).then(() => {

        // 🔥 Preenche automaticamente o input
        const inputCor = document.getElementById("corHex");
        inputCor.value = hex;

        // Feedback visual no input
        inputCor.style.borderColor = "#28a745";
        inputCor.style.boxShadow = "0 0 6px rgba(40,167,69,0.6)";

        setTimeout(() => {
            inputCor.style.borderColor = "#555";
            inputCor.style.boxShadow = "none";
        }, 1200);

        // Troca ícone temporariamente
        const icon = elemento.querySelector(".copy-icon");
        icon.innerHTML = `<i class="fa-solid fa-check"></i>`;
        icon.style.color = "#28a745";

        setTimeout(() => {
            icon.innerHTML = `<i class="fa-solid fa-copy"></i>`;
            icon.style.color = "#ffffff";
        }, 1200);

        // Remove seleção anterior
        document.querySelectorAll(".cor-item").forEach(item => {
            item.classList.remove("cor-selecionada");
        });

        // Destaca a selecionada
        elemento.classList.add("cor-selecionada");

    });

}