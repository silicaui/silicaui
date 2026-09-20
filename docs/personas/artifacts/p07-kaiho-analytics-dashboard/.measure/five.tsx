import { createRoot } from "react-dom/client";
import { Badge, Button, Card, CardBody, CardTitle } from "@wizeworks/silicaui-react";
createRoot(document.getElementById("root")!).render(
  <Card><CardBody><CardTitle>Kaihō</CardTitle><Badge color="error">late</Badge><Button color="primary">Go</Button></CardBody></Card>,
);
