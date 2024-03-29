import puppeteer from "puppeteer"
import inquirer from "inquirer"

function delay(time) {
	return new Promise((resolve) => {
		setTimeout(resolve, time)
	})
}

async function getPresence() {
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
				{
					name: "SENAI - 2022",
					value: 5,
				},
				{
					name: "SESI - 2022",
					value: 6,
				},
			],
		},
	])

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
	await page.evaluate((selector) => {
		document.querySelector(selector).click()
	}, `#divListaCursos > div:nth-child(${curso.option})`)
	await page.waitForSelector("#btnConfirmar")
	await page.evaluate(() => document.querySelector("#btnConfirmar").click())

	await delay(2000)
	console.log("Acessando menu de presença...")
	await page.waitForSelector(".ico-central-aluno")
	await page.$eval(".ico-central-aluno", (item) => item.click())
	await page.$eval(".ico-central-aluno", (item) => item.click())
	await page.$eval("#EDU_PORTAL_ACADEMICO_CENTRALALUNO_FALTAS", (item) =>
		item.click()
	)

	await page.waitForSelector("#faltasGrid")
	await delay(3000) //ter certeza de que carregou
	const presences = await page.evaluate(() => {
		const titleElements = document.querySelectorAll(
			"#faltasGrid > div > div.k-grid-header > div > table > thead > tr > th > a"
		)
		const detailRows = document.querySelectorAll(
			"#faltasGrid > div > div.k-grid-content.k-auto-scrollable > table > tbody > tr"
		)

		let presencas = [],
			titulos = []

		titleElements.forEach((title) => titulos.push(title.textContent))

		detailRows.forEach((row, rowIndex) => {
			// pegar a materia
			const subject = row.querySelector("td:nth-child(2) > a").textContent
			presencas.push({
				[subject]: {},
			})

			// pegar as notas de devida materia
			for (let i = 3; i < titulos.length; i++) {
				const grade = row.querySelector(`td:nth-child(${i + 1}) > span`)
					.textContent

				// adicionar esta nota ao indice da coluna atual
				const currentSubject = presencas[rowIndex]
				const subObject = Object.values(currentSubject)[0]
				Object.assign(subObject, {
					[titulos[i]]: grade,
				})
			}
		})

		return { presencas }
	}, curso.option)
	await browser.close()
	return presences
}

export default getPresence
