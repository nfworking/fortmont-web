import { prisma } from "@/lib/prisma";




// GET all LXC
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") ?? undefined;


  const apiUsers = await prisma.apiUsers.findMany({
    where: {
      id: id,      
    },
  });

  return Response.json(apiUsers);
}


export async function POST(req: Request) {
  const body = await req.json();

  const apiUser = await prisma.apiUsers.create({
    data: {
      fName: body.firstName,
      lName: body.lastName,
      role: body.role,
      department: body.department,
      publicPhoto: body.publicPhoto,
      personalEmail: body.personalEmail,


    },
  });

  return Response.json(apiUser);
}   
