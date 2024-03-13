import puppeteer from "puppeteer"
import inquirer from "inquirer"

function delay(time) {
	return new Promise((resolve) => {
		setTimeout(resolve, time)
	})
}

async function getGrades() {
	const cpf = await inquirer.prompt([
		{
			type: "password",
			name: "value",
			message: "Insira seu CPF:",
			prefix: "@",
		},
	])
	const senha = await inquirer.prompt([
		{
			type: "password",
			name: "value",
			message: "Insira sua senha:",
			prefix: "#",
		},
	])

	const curso = await inquirer.prompt([
		{
			type: "list",
			name: "option",
			message: "Qual dos cursos escolher?",
			choices: [
				{
					name: "SENAI - 2024",
					value: 1,
				},
				{
					name: "SESI - 2024",
					value: 2,
				},
				{
					name: "SENAI - 2023",
					value: 3,
				},
				{
					name: "SESI - 2023",
					value: 4,
				},
			],
		},
	])

	console.log("Inicializando...")
	const browser = await puppeteer.launch()
	const page = await browser.newPage()

	console.log("Acessando o portal do aluno...")
	await page.goto(
		"https://www.firjansenaisesi.com.br/web/app/edu/portaleducacional/login/"
	)
	console.log("Inserindo dados de login...")
	await page.waitForSelector("div.login-box.animated.fadeInDown")
	await page.evaluate(() => {
		const loginBox = document.querySelector(
			"div.login-box.animated.fadeInDown"
		)
		loginBox.addEventListener("transitionend", () => {
			return
		})
	})
	await page.type("#User", cpf.value)
	await page.type("#Pass", senha.value)
	await page.waitForSelector("input[type=submit]")
	await page.evaluate(() => {
		document
			.querySelector(
				"body > div.container > div.login-box.animated.fadeInDown > form > div:nth-child(4) > input[type=submit]"
			)
			.click()
	})

	await delay(2000)
	await page.waitForSelector(
		"#divListaCursos > div:nth-child(4) > div:nth-child(1) > div > div"
	)
	console.log("Login feito com sucesso!")
	console.log("Selecionando curso...")
	await page.evaluate(
		(selector) => document.querySelector(selector).click(),
		`#divListaCursos > div:nth-child(${curso.option}) > div:nth-child(1) > div > div`
	)
	await page.waitForSelector("#btnConfirmar")
	await page.evaluate(() => document.querySelector("#btnConfirmar").click())

	await page.waitForSelector(".ico-central-aluno")

	console.log("Acessando menu de notas...")
	await page.$eval(".ico-central-aluno", (item) => item.click())
	await page.$eval(".ico-central-aluno", (item) => item.click())
	await page.$eval(
		"#EDU_PORTAL_ACADEMICO_CENTRALALUNO_NOTAS > span",
		(item) => item.click()
	)

	await page.waitForSelector("tbody > tr")
	console.log("Pegando notas...")
	await delay(3000)
	const list = await page.evaluate((course) => {
		const table = document.querySelectorAll(
			"#MYGRID > div > div.k-grid-content.k-auto-scrollable > table > tbody > tr"
		)
		let lista = []
		if (course % 2 == 0) {
			let materias = [],
				notas1 = [],
				notas2 = [],
				notas3 = [],
				notas4 = []

			table.forEach((item) => {
				materias.push(item.querySelector("td a").textContent)
				notas1.push(item.querySelectorAll("td")[6].textContent)
				notas2.push(item.querySelectorAll("td")[9].textContent)
				notas3.push(item.querySelectorAll("td")[12].textContent)
				notas4.push(item.querySelectorAll("td")[15].textContent)
			})
			for (let i = 0; i <= materias.length; i++) {
				if (materias[i].includes("TI")) break // remove as últimas disciplinas que são do SENAI e estão em outro portal
				lista.push({
					[materias[i]]: {
						"Primeiro Bimestre": Number(notas1[i]),
						"Segundo Bimestre": Number(notas2[i]),
						"Terceiro Bimestre": Number(notas3[i]),
						"Quarto Bimestre": Number(notas4[i]),
					},
				})
			}
			return lista
		} else {
			let materias = [],
				medias = []

			table.forEach((item) => {
				materias.push(item.querySelector("td a").textContent)
				medias.push(item.querySelectorAll("td")[6].textContent)
			})

			for (let i = 0; i <= materias.length; i++) {
				lista.push({
					Matéria: materias[i],
					"Média final": medias[i],
				})
			}
		}
		return lista.slice(lista, lista.length - 1)
	}, curso.option)
	await browser.close()
	return list
}

export default getGrades