import * as React from 'react';
import {useState,useRef} from 'react';
import {Card, CardBody, CardFooter, CardTitle, PageSection, Title} from '@patternfly/react-core';
import { Flex, FlexItem } from '@patternfly/react-core';

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

class TopicSocket {
  private static instance: TopicSocket;
  private static topicsWebsocketEndpoint = process.env.TOPICS_WEBSOCKET_ENDPOINT ?
    process.env.TOPICS_WEBSOCKET_ENDPOINT : "ws://localhost:8080/topic/messages"; // fallback endpoint uri

  private webSocket: WebSocket = new WebSocket(TopicSocket.topicsWebsocketEndpoint);
  private topicListeners: { (string): void }[] = [];

  addTopicListener(topicListener: { (string): void }) {
    this.topicListeners.push(topicListener);

    this.webSocket.onmessage = (event) => {
      console.debug(event.data);
      for(let i=0; i<this.topicListeners.length; i++) {
        this.topicListeners[i](event.data);
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
