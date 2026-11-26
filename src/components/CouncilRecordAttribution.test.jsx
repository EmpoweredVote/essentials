// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import CouncilRecordAttribution from './CouncilRecordAttribution';

afterEach(cleanup);

describe('CouncilRecordAttribution', () => {
  it('names the city, dropping a leading "City of"', () => {
    render(<CouncilRecordAttribution governmentName="City of Testville" />);
    expect(screen.getByText("From the clerk's records of the Testville Common Council.")).toBeTruthy();
  });

  it('uses a generic line when the government name is missing', () => {
    render(<CouncilRecordAttribution governmentName="" />);
    expect(screen.getByText("From the clerk's records of the city council.")).toBeTruthy();
  });
});
