/**
 * One page, both systems, nothing shared.
 *
 * The left column is the shop admin as it is today: daisyUI classes, untouched.
 * The right column is the same three controls migrated to Silica, which is
 * namespaced to `sx-` by the plugin option and by `<SilicaProvider prefix>`.
 *
 * If the two ever collided, one column would take the other's styling. They do
 * not, and `verify.mjs` next to this file is the check that says so rather than
 * a screenshot somebody eyeballed.
 */
import { SilicaProvider, Button, Badge, Card, CardBody, CardTitle } from "@wizeworks/silicaui-react";

export function App() {
  return (
    <div className="grid min-h-full gap-6 bg-base-100 p-6 text-base-content lg:grid-cols-2">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Not migrated yet — daisyUI</h2>
        <div className="card border border-base-300 bg-base-200">
          <div className="card-body gap-3">
            <h3 className="card-title">Order PD-ORD-8841</h3>
            <div>
              <span className="badge badge-warning">Picking</span>
            </div>
            <button className="btn btn-primary btn-sm w-fit">Print picking slip</button>
          </div>
        </div>
      </section>

      <SilicaProvider prefix="sx-">
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Migrated — Silica</h2>
          <Card className="border border-base-300 bg-base-200">
            <CardBody className="gap-3">
              <CardTitle>Order PD-ORD-8841</CardTitle>
              <div>
                <Badge color="warning">Picking</Badge>
              </div>
              <Button color="primary" size="sm" className="w-fit">
                Print picking slip
              </Button>
            </CardBody>
          </Card>
        </section>
      </SilicaProvider>
    </div>
  );
}
