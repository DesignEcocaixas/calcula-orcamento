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

        btnCopiar.innerHTML = `<i class="fa-solid fa-check"></i>`;
        btnCopiar.style.color = "#28a745";

        setTimeout(() => {
            btnCopiar.innerHTML = `<i class="fa-solid fa-copy"></i>`;
            btnCopiar.style.color = "#ffffff";
        }, 1500);

    });

}

function limparCampos() {

    document.querySelectorAll("input").forEach(input => {
        input.value = "";
    });

    const selectModelo = document.querySelector("select");
    if (selectModelo) {
        selectModelo.selectedIndex = 0;
    }

    document.getElementById("resultado").textContent = "R$ 0,00";

    const listaCores = document.getElementById("listaCores");

    if (listaCores) {

        // 🔥 ANIMAÇÃO DE SAÍDA
        listaCores.classList.remove("mostrar");
        listaCores.classList.add("saindo");

        setTimeout(() => {
            listaCores.innerHTML = "";
            listaCores.classList.remove("saindo");
        }, 300);
    }

    document.querySelectorAll(".cor-item").forEach(item => {
        item.classList.remove("cor-selecionada");
    });

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

    document.getElementById("largura").value = largura;
    document.getElementById("altura").value = altura;

    document.getElementById("larguraReal").value = largura;
    document.getElementById("alturaReal").value = altura;
}

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

        // 🔥 ANIMAÇÃO DE ENTRADA
        container.classList.remove("mostrar");
        void container.offsetWidth;
        container.classList.add("mostrar");
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

        const inputCor = document.getElementById("corHex");
        inputCor.value = hex;

        inputCor.style.borderColor = "#28a745";
        inputCor.style.boxShadow = "0 0 6px rgba(40,167,69,0.6)";

        setTimeout(() => {
            inputCor.style.borderColor = "#555";
            inputCor.style.boxShadow = "none";
        }, 1200);

        const icon = elemento.querySelector(".copy-icon");
        icon.innerHTML = `<i class="fa-solid fa-check"></i>`;
        icon.style.color = "#28a745";

        setTimeout(() => {
            icon.innerHTML = `<i class="fa-solid fa-copy"></i>`;
            icon.style.color = "#ffffff";
        }, 1200);

        document.querySelectorAll(".cor-item").forEach(item => {
            item.classList.remove("cor-selecionada");
        });

        elemento.classList.add("cor-selecionada");

    });

}

const modelosCaixas = [
    {
        categoria: "Pizza",
        itens: [
            { nome: "Pizza N20", medida: "27.7x27.7" },
            { nome: "Pizza N26", medida: "35.7x35.7" },
            { nome: "Pizza N30", medida: "40.7x40.7" },
            { nome: "Pizza N35", medida: "45.7x45.7" },
            { nome: "Pizza N40", medida: "50.7x50.7" },
            { nome: "Pizza N45", medida: "57.7x57.7" }
        ]
    },
    {
        categoria: "Pizza Separada",
        itens: [
            { nome: "Pizza Separada N26", medida: "36x36" },
            { nome: "Pizza Separada N30", medida: "40x40" },
            { nome: "Pizza Separada N35", medida: "46x46" },
            { nome: "Pizza Separada N40", medida: "51x51" }
        ]
    },
    {
        categoria: "Smart",
        itens: [
            { nome: "Smart 30", medida: "40x40" },
            { nome: "Smart 35", medida: "45x45" },
            { nome: "Smart 40", medida: "51x51" }
        ]
    },
    {
        categoria: "Quadrada",
        itens: [
            { nome: "Quadrada Pizza 35", medida: "45.7x45.7" },
            { nome: "Quadrada P", medida: "29x22" },
            { nome: "Quadrada M", medida: "36x25" },
            { nome: "Quadrada G", medida: "43x25" }
        ]
    },
    {
        categoria: "Stuffed",
        itens: [
            { nome: "Stuffed M", medida: "35x23.5" },
            { nome: "Stuffed G", medida: "43.5x33" }
        ]
    },
    {
        categoria: "Calzone",
        itens: [
            { nome: "Calzone P", medida: "39x23" },
            { nome: "Calzone G", medida: "47.5x27.5" }
        ]
    },
    {
        categoria: "Especial",
        itens: [
            { nome: "Pizza 70cm", medida: "81x47" }
        ]
    },
    {
        categoria: "Retangular",
        itens: [
            { nome: "Retangular Mini", medida: "37.5x20.5" },
            { nome: "Retangular PP", medida: "39.8x23.9" },
            { nome: "Retangular P", medida: "40x31" },
            { nome: "Retangular M", medida: "50.5x35.5" },
            { nome: "Retangular G", medida: "61.5x45.5" }
        ]
    },
    {
        categoria: "Combo",
        itens: [
            { nome: "Combo M", medida: "41.5x34.5" },
            { nome: "Combo G", medida: "39.7x37.4" },
            { nome: "Combo GG", medida: "57x51.6" }
        ]
    }
];

function carregarSelectModelos() {

    const select = document.getElementById("selectModelo");

    // Opção padrão
    select.innerHTML = `<option value="">Selecione um modelo</option>`;

    modelosCaixas.forEach(grupo => {

        const optgroup = document.createElement("optgroup");
        optgroup.label = grupo.categoria;

        grupo.itens.forEach(item => {
            const option = document.createElement("option");
            option.value = item.medida;
            option.textContent = item.nome;
            optgroup.appendChild(option);
        });

        select.appendChild(optgroup);
    });

}

document.addEventListener("DOMContentLoaded", function () {
    carregarSelectModelos();
});