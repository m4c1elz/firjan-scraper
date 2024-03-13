import inquirer from "inquirer"
import getGrades from "./scrapers/grades.js"
import getPresence from "./scrapers/presence.js"

async function main() {
	console.log("\nBem-vindo ao scraper da firjan!")
	while (true) {
		const { value } = await inquirer.prompt({
			message: "O que deseja fazer?",
			name: "value",
			type: "list",
			choices: [
				{
					name: "Pegar notas",
					value: 0,
				},
				{
					name: "Pegar percentual de presenças",
					value: 1,
				},
				{
					name: "Sair",
					value: 2,
				},
			],
		})

		if (value == 0) {
			const grades = await getGrades()
			console.log(JSON.stringify(grades, null, 2) + "\n")
		}
		if (value == 1) {
			const presences = await getPresence()
			console.log(JSON.stringify(presences, null, 2) + "\n")
		}
		if (value >= 2) {
			break
		}
		continue
	}
}

main()
