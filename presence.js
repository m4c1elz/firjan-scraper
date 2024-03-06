import puppeteer from "puppeteer"
import inquirer from "inquirer"

function delay(time) {
	return new Promise((resolve) => {
		setTimeout(resolve, time)
	})
}

async function main() {
	console.log("Bem-vindo ao scraper de percentual de presença da firjan!")

	const cpf = await inquirer.prompt([
		{
			type: "password",
			name: "value",
			message: "Insira seu CPF:",
		},
	])

	const senha = await inquirer.prompt([
		{
			type: "password",
			name: "value",
			message: "Insira sua senha:",
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

	const bdetailRowser = await puppeteer.launch({ headless: false })
	const page = await bdetailRowser.newPage()

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
	const presences = await page.evaluate((course) => {
		const titleElements = document.querySelectorAll(
			"#faltasGrid > div > div.k-grid-header > div > table > thead > tr > th > a"
		)
		const detailRows = document.querySelectorAll("table > tbody > tr")

		if (course % 2 == 0) {
			// todo, sesi
			return "Trabalho em progresso!"
		} else {
			// você parou aqui! vai trabalhar
			let materias = [],
				presencas = [],
				titulos = []

			titleElements.forEach((item) => {
				const title = item.textContent
				titulos.push(title)
			})

			for (let i = 0; i < titulos.length; i++) {
				const item = detailRows[i].querySelector(
					`td:nth-child(5) > span`
				).textContent
				presencas.push(item)
			}

			detailRows.forEach((row) => {
				const nome = row.querySelector("td:nth-child(2)").textContent
				materias.push(nome)
			})
			return { materias, titulos, presencas }
		}
	}, curso.option)
	console.log(presences)
}

main()
