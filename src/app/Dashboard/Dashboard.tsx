import * as React from 'react';
import {useState,useRef} from 'react';
import {Card, CardBody, CardFooter, CardTitle, PageSection, Title} from '@patternfly/react-core';
import { Chart, ChartAxis, ChartBar, ChartBarProps, ChartGroup, ChartThemeColor, ChartVoronoiContainer } from '@patternfly/react-charts';
import { Flex, FlexItem } from '@patternfly/react-core';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { VictoryBar } from 'victory-bar';

const Dashboard: React.FunctionComponent = () => (
  <React.Fragment>
    <PageSection>
      <Title headingLevel="h1" size="lg">Orders and inventory dashboard</Title>
    </PageSection>
    <PageSection>
      <Flex>
        <FlexItem flex={{ default: 'flex_1' }}><TopicCountCard topic="orders" text="Orders placed by customers"/></FlexItem>
        <FlexItem flex={{ default: 'flex_1' }}><TopicCountCard topic="shipments" text="Shipments (orders) dispatched from warehouse"/></FlexItem>
      </Flex>
    </PageSection>
    <PageSection>
      <div style={{ height: '450px', width: '1200px' }}>
        <StockChart />
      </div>
    </PageSection>
  </React.Fragment>
)

const TopicCountCard: React.FunctionComponent<{topic, text}> = ({topic, text}) => {
  const [orderCount, setCount] = useState(0);

  const incrementMessageCount = (message: string): void => {
    if (message.startsWith(topic)) {
      setCount(count => count + 1);
    }
  }

  const firstUpdate = useRef(true);
  if (firstUpdate.current) { // Add TopicListener only on first render
    firstUpdate.current = false;

    TopicSocket.getInstance().addTopicListener(incrementMessageCount);
  }

  return (
    <Card isCompact>
      <CardTitle>{text}</CardTitle>
      <CardBody>{orderCount}</CardBody>
    </Card>
  )
}

type BarDataPoint = {
  name: string,
  x: string,
  y: number
}

const StockChart: React.FunctionComponent = () => {
  const [skus, setSkus] = useState(new Array<string>());
  const [skuData, setSkuData] = useState(new Map<string,[BarDataPoint,BarDataPoint,BarDataPoint]>());

  const updateListForNewSkusListener = (message: string): void => {
    const [topic, sku] = message.split(":").slice(0,2);

    const setSkuStockMessageListener = (message: string): void => {
      const [name, messageSku, y] = message.split(":").slice(0,3);
      if(messageSku !== sku) {
        return; // this listener will receive all the messages
      }

      const initializedBarDataPoint = [{ name: sku, x: 'Stock', y: 0 }, { name: sku, x: 'Reserved', y: 0 }, { name: sku, x: 'Available', y: 0 }];

      if(name === 'stock-levels') {
        setSkuData((oldSkuData) => {
          const [levels, reserved, available] = oldSkuData.get(sku) || initializedBarDataPoint;

          levels.y = +y; // stock levels are absolute

          return new Map(oldSkuData.set(sku, [levels, reserved, available]));
        });
      }

      if(name === 'reserved-stock') {
        setSkuData((oldSkuData) => {
          const [levels, reserved, available] = oldSkuData.get(sku) || initializedBarDataPoint;

          reserved.y += +y; // reserved stock is cumulative

          return new Map(oldSkuData.set(sku, [levels, reserved, available]));
        });
      }

      if(name === 'available-stock') {
        setSkuData((oldSkuData) => {
          const [levels, reserved, available] = oldSkuData.get(sku) || initializedBarDataPoint;

          available.y = +y; // available stock is absolute

          return new Map(oldSkuData.set(sku, [levels, reserved, available]));
        });
      }
    }

    if (topic === 'reserved-stock' || topic === 'stock-levels' || topic === 'available-stock') {
      setSkus(oldSkus => {
        if (oldSkus.indexOf(sku) === -1) {
          const newSkus = oldSkus.slice();
          newSkus.push(sku);

          // In addition to adding the new sku, we also add a listener for stock updates for that sku
          TopicSocket.getInstance().addTopicListener(setSkuStockMessageListener);

          return newSkus;
        } else {
          return oldSkus; // sku already added, no need to re-render anything.
        }
      }); // make sure a new ChartBar is added for any new sku.
    }
  }

  const firstUpdate = useRef(true);
  if (firstUpdate.current) { // Add TopicListener only on first render
    firstUpdate.current = false;

    TopicSocket.getInstance().addTopicListener(updateListForNewSkusListener);
  }

  return (
    <Chart
      ariaDesc="Stock count"
      ariaTitle="Realtime stock inventory"
      containerComponent={<ChartVoronoiContainer labels={({ datum }) => `${datum.name}: ${datum.y}`} constrainToVisibleArea />}
      domainPadding={{ x: [55, 55] }}
      legendData={legendData(skus)}
      legendPosition="bottom-left"
      height={400}
      padding={{
        bottom: 75, // Adjusted to accommodate legend
        left: 50,
        right: 100, // Adjusted to accommodate tooltip
        top: 50
      }}
      themeColor={ChartThemeColor.multiOrdered}
      width={1000}
    >
      <ChartAxis />
      <ChartAxis dependentAxis showGrid />
      <ChartGroup offset={11}>
        {skus.map((sku) => <ChartBar key={sku} data={skuData.get(sku)} />)}
      </ChartGroup>
    </Chart>
  )
}

/* Best to move ChartBar state down to its own component, below, but wrapping ChartBar has caused problems with rendering -- TODO: Fix.

const StockChartBar: React.FunctionComponent<ChartBarProps & {sku:string}> = (props) => {
  const {sku, ...chartBarProps} = props;
  const {data, ...nonDataChartBarProps} = {...chartBarProps};

  const [stockLevel, setStockLevel] = useState(0);
  const [reservedStock, setReservedStock] = useState(0);
  const [availableStock, setAvailableStock] = useState(0);

  const setQuantity = (message: string): void => {

    if(message.startsWith('stock-levels:' + props.sku)) {
      const sku: string = message.split(":")[1];
      const quantity = +message.split(":")[2];

      setStockLevel(quantity); // stock levels are absolute
      return;
    }

    if(message.startsWith('reserved-stock:' + props.sku)) {
      const sku: string = message.split(":")[1];
      const quantity = +message.split(":")[2];

      setReservedStock(q => q + quantity); // reserved stock is cumulative
      return;
    }

    if(message.startsWith('available-stock:' + props.sku)) {
      const sku: string = message.split(":")[1];
      const quantity = +message.split(":")[2];

      setAvailableStock(quantity); // available stock is absolute
      return;
    }
  }

  const firstUpdate = useRef(true);
  if (firstUpdate.current) { // Add TopicListener only on first render
    firstUpdate.current = false;

    TopicSocket.getInstance().addTopicListener(setQuantity);
  }

  return (
    <ChartBar data={[{ name: props.sku, x: 'Stock', y: stockLevel }, { name: props.sku, x: 'Reserved', y: reservedStock }, { name: props.sku, x: 'Available', y: availableStock }]} {...nonDataChartBarProps} />
  )
}*/

const legendData = (skus: string[]) => {
  let legendMap = new Array<{name: string}>(skus.length);

  for(let i=0; i<skus.length; i++) {
    legendMap[i] = {name: skus[i]};
  }

  return legendMap;
}

class TopicSocket {
  private static instance: TopicSocket;
  private static topicsWebsocketEndpoint = process.env.TOPICS_WEBSOCKET_ENDPOINT ?
    process.env.TOPICS_WEBSOCKET_ENDPOINT : "ws://localhost:8080/topic/messages"; // fallback endpoint uri

  private webSocket: WebSocket = new WebSocket(TopicSocket.topicsWebsocketEndpoint);
  private topicListeners: { (string): void }[] = [];

  addTopicListener(topicListener: { (string): void }) {
    this.topicListeners.push(topicListener);
    console.debug("this.topicListeners: " + this.topicListeners.length);

    this.webSocket.onmessage = (event) => {
      console.debug(event.data);
      for(let i=0; i<this.topicListeners.length; i++) {
        this.topicListeners[i](event.data)
      }
    }
  }

  static getInstance(): TopicSocket {
    if (!TopicSocket.instance) {
      TopicSocket.instance = new TopicSocket();
    }

    return TopicSocket.instance;
  }
}


export { Dashboard };
