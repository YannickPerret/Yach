const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const yannick = await prisma.User.upsert({
    where: { username: 'yannick' },
    update: {},
    create: {
        username: 'yannick',
        token: '123456789',
    },
  })

  const epsitec = await prisma.User.upsert({
    where: { username: 'epsitec' },
    update: {},
    create: {
      username: 'epsitec',
      token: '987654321',
    },
  })
  console.log({ yannick, epsitec })
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