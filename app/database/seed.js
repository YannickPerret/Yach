const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const Database = require('../class/database')

async function main() {
  const yannick = await Database.getInstance().user.create({
    data: {
        username: 'yannick',
        token: '123456789',
    },
  })

  const epsitec = await Database.getInstance().user.create({
    data: {
      username: 'epsitec',
      token: '987654321',
    },
  })
}


main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })